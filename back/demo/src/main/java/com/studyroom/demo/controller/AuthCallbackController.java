package com.studyroom.demo.controller;

import com.studyroom.demo.service.AuthService;
import com.fasterxml.jackson.databind.JsonNode;
import com.studyroom.demo.entity.*;
import com.studyroom.demo.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
// import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthCallbackController {
    private final UserRepository userRepository;
    private final AuthService authService;
    private static final String jsessionid = "AUTH_SESSION_USER";

    @GetMapping("/login/oauth2/code/google")
    public ResponseEntity<?> handleAuthCallback(@RequestParam("code") String code, @RequestParam("state") String state, HttpSession session, HttpServletResponse response) throws IOException {

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
        }

        session.setAttribute(jsessionid, new SessionValue(accessToken, user));
        response.sendRedirect("http://localhost:3000/index.html");

        return ResponseEntity.ok().build();
    }   


    public record AuthCallbackRequest(
            String code,
            String state
    ) {
    }

    public record SessionValue(
            String accessToken,
            Object userInfo
    ) {
    }

}
