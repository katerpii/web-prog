package com.studyroom.demo.service;

import com.studyroom.demo.entity.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

import org.springframework.http.*;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.web.reactive.function.client.WebClientAutoConfiguration;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class GithubAuthService implements AuthService {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${oauth.github.client-id}")
    private String clientId;

    @Value("${oauth.github.redirect-uri}")
    private String redirectUrl;

    @Value("${oauth.github.client-secret}")
    private String clientSecret;

    private static final String TOKEN_URL = "https://github.com/login/oauth/access_token";
    private static final String USERINFO_URL = "https://api.github.com/user";
    @Override
    public String getAccessToken(String authorizationCode) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUrl);
        form.add("code", authorizationCode);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);

        // RestTemplate restTemplate = new RestTemplate();
        // restTemplate.getMessageConverters().add(0, new FormHttpMessageConverter());

        ResponseEntity<String> response = restTemplate.postForEntity(
            TOKEN_URL,
            request,
            String.class
        );

        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse token", e);
        }
    }



    @Override
    public Object fetchUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
            USERINFO_URL,
            HttpMethod.GET,
            request,
            String.class);

        try {
            return objectMapper.readTree(response.getBody());
        } catch(Exception e){
            throw new RuntimeException("Failed to fetch userInfo");
        }
    }

}
