package com.studyroom.demo.etc;

public record AuthCallbackRequest(
        String code,
        String state
) {
}
