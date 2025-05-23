package com.studyroom.demo.etc;

public record SessionValue(
        String accessToken,
        Object userInfo
) {
}