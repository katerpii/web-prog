package com.studyroom.demo.controller;

import com.studyroom.demo.service.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.studyroom.demo.etc.*;
import com.studyroom.demo.entity.*;
import com.studyroom.demo.repository.PageRepository;
import com.studyroom.demo.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
// import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/login/oauth2/code/github")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthCallbackGithubController {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final PageRepository pageRepository;

    public AuthCallbackGithubController(
        UserRepository userRepository,
        PageRepository pageRepository,
        @Qualifier("githubAuthService") AuthService authService
    ) {
        this.userRepository = userRepository;
        this.pageRepository = pageRepository;
        this.authService = authService;
    }

    private static final String jsessionid = "AUTH_SESSION_USER";

    @GetMapping
    public ResponseEntity<User> handleGithubAuthCallback(@RequestParam("code") String code, @RequestParam("state") String state, HttpSession session, HttpServletResponse response) throws IOException {

        String accessToken = authService.getAccessToken(code);
        JsonNode userInfo = (JsonNode)authService.fetchUserInfo(accessToken);

        String email = userInfo.get("email").asText();
        String name = userInfo.has("name") ? userInfo.get("name").asText() : "사용자";
        
        Optional<User> existingUser = userRepository.findByUserEmail(email);
        User user;

        if (existingUser.isPresent()) user = existingUser.get();
        else {
            user = User.builder()
            .username(name)
            .userEmail(email)
            .build();
            user = userRepository.save(user);

            Page page = Page.builder()
            .pagename(user.getUsername() + "'s Project") // 페이지 이름
            .githubUrl("https://github.com/") // 예시 GitHub URL
            .user(user) // User와 연결
            .boards(createBoards()) // Board 생성
            .cards(new ArrayList<>()) // 빈 카드 목록
            .build();

            page.getBoards().forEach(board -> board.setPage(page));
            pageRepository.save(page);
        }   
        // 일반 로그인 과정에서는 /initialize -> index.html?page=mypage
        // 초대 로그인 과정에서는 /initialize -> index.html?page=invitepage

        session.setAttribute(jsessionid, new SessionValue(accessToken, user));
        ObjectMapper objectMapper = new ObjectMapper();
        byte[] decodedBytes = Base64.getDecoder().decode(state);

        String jsonString = new String(decodedBytes, StandardCharsets.UTF_8);

        JsonNode decodedState = objectMapper.readTree(jsonString);

        boolean isInvite = decodedState.get("is_invite").asBoolean(); 
        // String inviteCode = decodedState.get("invite_code").asText(); 
        String redirectUri = decodedState.get("redirect_uri").asText(); 

        if (isInvite) {
            response.sendRedirect(redirectUri); 
            return ResponseEntity.ok(user);
        }
 
        redirectUri += "?page=" + user.getId();;
        response.sendRedirect(redirectUri);
        return ResponseEntity.ok(user);
    }   
    private List<Board> createBoards() {
        List<Board> boards = new ArrayList<>();
    
        // 각 상태에 맞는 Board 생성 및 Page와 연결
        boards.add(Board.builder()
                .status("Scheduled")  
                .build());
        boards.add(Board.builder()
                .status("In Progress")  
                .build());
        boards.add(Board.builder()
                .status("Done")  
                .build());
    
        return boards;
    }
}
// boolean default?