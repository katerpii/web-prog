package com.studyroom.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.context.annotation.Bean;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .cors()
            .and()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login/oauth2/**", "/auth/**", "/api/**", "/user/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
