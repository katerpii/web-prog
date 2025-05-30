package com.studyroom.dto;
import lombok.*;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BoardDto {
    private Integer id;
    private String status;
    private List<CardDto> cards;
}
