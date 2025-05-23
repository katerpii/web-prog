package com.studyroom.demo.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.studyroom.demo.etc.*;
import com.studyroom.demo.entity.User;
import com.studyroom.dto.CheckUserDto;

import jakarta.servlet.http.HttpSession;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class LoginController {
    @GetMapping("/login/oauth2/google")
    public ResponseEntity<Map<String, Object>> getGoogleAuthorizeResource() {
        Map<String, Object> response = new HashMap<>();
        response.put("authorization", new GoogleAuthResponse());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/login/oauth2/github")
    public ResponseEntity<Map<String, Object>> getGithubAuthorizeResource() {
        Map<String, Object> response = new HashMap<>();
        response.put("authorization", new GithubAuthResponse());
        return ResponseEntity.ok(response);
    }

    @Data
    public static class GoogleAuthResponse {
        private String authorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
        private String clientId = "678163502515-9uthuk33vt618gs3i8cgik61lpbtg64k.apps.googleusercontent.com";
        private String redirectUrl = "http://localhost:3030/login/oauth2/code/google";
        private String responseType = "code";
        private String scope = "openid profile email";
        private String state = UUID.randomUUID().toString();
    }
    // !! Intended vulnerability
    @Data
    public static class GithubAuthResponse {
        private String authorizationEndpoint = "https://github.com/login/oauth/authorize";
        private String clientId = "Ov23liOMpUIVkKax0CFM";
        private String redirectUrl = "http://localhost:3000/callback";
        private String responseType = "code";
        private String scope = "user repo";
        private String state = UUID.randomUUID().toString();
    }

    @GetMapping("/auth/check")
    public ResponseEntity<CheckUserDto> checkAuth(HttpSession session) {
        SessionValue sessionValue = (SessionValue) session.getAttribute("AUTH_SESSION_USER");

        if (sessionValue == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = (User) sessionValue.userInfo(); 

        CheckUserDto form = CheckUserDto.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .userEmail(user.getUserEmail())
                            .build();

        
        return ResponseEntity.ok(form);
        // Map<String> result = new HashMap<>();
        // result.put("id", user.getId());
        // result.put("email", user.getUserEmail());
        // result.put("name", user.getUsername());
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok().build();
    }
}
