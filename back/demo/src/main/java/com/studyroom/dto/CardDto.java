package com.studyroom.dto;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CardDto {
    private Integer id;
    private String name;
    private String author;
    private String startDate;
    private String endDate;
    private String status;
}
