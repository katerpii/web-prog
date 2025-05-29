package com.studyroom.demo.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException.BadRequest;

import com.fasterxml.jackson.databind.JsonNode;
import com.studyroom.demo.etc.*;
import com.studyroom.demo.service.PageService;
import com.studyroom.demo.entity.User;
import com.studyroom.dto.CheckUserDto;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class LoginController {
    private final PageService pageService;

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
        private String state = "";
    }
    // !! Intended vulnerability
    @Data
    public static class GithubAuthResponse {
        private String authorizationEndpoint = "https://github.com/login/oauth/authorize";
        private String clientId = "Ov23liOMpUIVkKax0CFM";
        private String redirectUrl = "http://localhost:3000/callback";
        private String responseType = "code";
        private String scope = "user repo";
        private String state = "";
    }

    // localhost:3000/index?page={pageId}&invite=123123
    @GetMapping("/auth/check")
    public ResponseEntity<Map<String, Object>> checkAuth(
            HttpSession session,
            HttpServletResponse response,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) String invite) throws IOException{

        Map<String, Object> form = new HashMap<>();

        SessionValue sessionValue = (SessionValue) session.getAttribute("AUTH_SESSION_USER");
        if (sessionValue == null) {
            form.put("authenticated", false);
        } else { 
            form.put("authenticated", true);

            User user = (User) sessionValue.userInfo();
            Integer userId = user.getId();

            form.put("user", Map.of(
                "id", userId,
                "username", user.getUsername(),
                "userEmail", user.getUserEmail()
            ));


            if (page != null) {
                boolean hasAccess = pageService.checkUserAccessToPage(userId, page); // required
                form.put("hasAccess", hasAccess);
            } else {
                form.put("hasAcecss", false);
            }
        } // 세션이 없는 사용자가 invited -> 로그인 후 이메일 검증
          // 세션이 있는 사용자가 invited -> 해당 세션 이메일 검증
        if (invite != null) {
            if (sessionValue == null) form.put("isInvite", true);
            else { pageService.acceptInviteCode(sessionValue, page, invite);}
        } else {
            form.put("isInvite", false);
        }
        System.out.println("[*] form: ", form);
        return ResponseEntity.ok(form);
    }


    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok().build();
    }
}
