package com.studyroom.demo.controller;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.studyroom.demo.entity.Collaborator;
import com.studyroom.demo.entity.Page;
import com.studyroom.demo.entity.User;
import com.studyroom.demo.etc.SessionValue;
import com.studyroom.demo.repository.CollaboratorRepository;
import com.studyroom.demo.repository.PageRepository;
import com.studyroom.demo.repository.UserRepository;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class InviteController {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final PageRepository pageRepository;
    private final CollaboratorRepository collaboratorRepository;

    @PostMapping("/invite")
    public ResponseEntity<String> sendInvite(@RequestBody Map<String, String> body,
                                         HttpSession session) {
    // 세션에서 로그인 사용자 정보 가져오기
    SessionValue sessionValue = (SessionValue) session.getAttribute("AUTH_SESSION_USER");

    if (sessionValue == null || sessionValue.userInfo() == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
    }

    User inviter = (User) sessionValue.userInfo(); // 유저 객체 직접 꺼내기

    Integer pageId = Integer.parseInt(body.get("page"));
    String inviteEmail = body.get("email");
    if (inviteEmail == null || inviteEmail.isBlank()) {
        return ResponseEntity.badRequest().body("이메일이 유효하지 않습니다.");
    }

    // 초대 링크 생성 (Base64로 이메일 인코딩)
    String code = Base64.getEncoder().encodeToString(inviteEmail.getBytes(StandardCharsets.UTF_8));
    String inviteUrl = "http://localhost:3000/index?page=" + pageId + "&invite=" + code;

    // 이메일 전송
    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(inviteEmail);
    message.setSubject("[프로젝트 협업 초대]");
    message.setText(inviter.getUsername() + "님이 당신을 프로젝트 페이지에 초대했습니다.\n\n" +
            "아래 링크를 클릭해 수락하세요:\n" + inviteUrl);
    mailSender.send(message);

    return ResponseEntity.ok("초대 이메일이 전송되었습니다.");
    }

    @GetMapping("/invite/accept")
    public ResponseEntity<String> acceptInvite(@RequestParam String code, HttpSession session) {
        SessionValue sessionValue = (SessionValue) session.getAttribute("AUTH_SESSION_USER");
        if (sessionValue == null || sessionValue.userInfo() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        User me = (User) sessionValue.userInfo();

        String decodedEmail = new String(Base64.getDecoder().decode(code), StandardCharsets.UTF_8);
        if (!me.getUserEmail().equals(decodedEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("로그인된 계정과 초대 이메일이 일치하지 않습니다.");
        }

        Optional<User> inviterOpt = userRepository.findByUserEmail(decodedEmail);
        if (inviterOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("초대한 사용자를 찾을 수 없습니다.");
        }

        Optional<Page> pageOpt = pageRepository.findByUser(inviterOpt.get());
        if (pageOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("해당 사용자의 페이지가 없습니다.");
        }

        boolean exists = collaboratorRepository.existsByUserAndPage(me, pageOpt.get());
        if (!exists) {
            Collaborator collab = Collaborator.builder()
                .user(me)
                .page(pageOpt.get())
                .build();
            collaboratorRepository.save(collab);
        }

        return ResponseEntity.ok("초대를 수락했습니다. 협업자로 등록되었습니다.");
    }
}
