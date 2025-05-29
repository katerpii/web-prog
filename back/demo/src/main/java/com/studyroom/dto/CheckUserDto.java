package com.studyroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckUserDto {
    private Integer id;
    private Integer pageId;
    private String username;
    private String userEmail;
}
