package com.studyroom.demo.service;

public interface AuthService {
    String getAccessToken(String authorizationCode);
    Object fetchUserInfo(String accessToken);
}
