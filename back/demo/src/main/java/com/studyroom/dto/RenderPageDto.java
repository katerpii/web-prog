package com.studyroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import com.studyroom.demo.entity.User;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenderPageDto {
    private String pagename;
    private String githubUrl;
    private User user;
    private List<BoardDto> boards;
}
