package com.resumeai.controller;

import com.resumeai.dto.AuthDto.ApiResponse;
import com.resumeai.dto.ResumeDto;
import com.resumeai.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    // Upload resume
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse> upload(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        try {
            ResumeDto dto = resumeService.uploadResume(userDetails.getUsername(), file);
            return ResponseEntity.ok(new ApiResponse(true, "Resume uploaded successfully", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get all resumes for user
    @GetMapping
    public ResponseEntity<List<ResumeDto>> getAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(resumeService.getUserResumes(userDetails.getUsername()));
    }

    // Get single resume
    @GetMapping("/{id}")
    public ResponseEntity<ResumeDto> getOne(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(resumeService.getResume(userDetails.getUsername(), id));
    }

    // Trigger AI analysis
    @PostMapping("/{id}/analyze")
    public ResponseEntity<ApiResponse> analyze(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            ResumeDto dto = resumeService.analyzeResume(userDetails.getUsername(), id);
            return ResponseEntity.ok(new ApiResponse(true, "Analysis complete", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Chat with resume
    @PostMapping("/{id}/chat")
    public ResponseEntity<ApiResponse> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String question = body.get("question");
        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Question is required"));
        }
        try {
            String answer = resumeService.chatWithResume(userDetails.getUsername(), id, question);
            return ResponseEntity.ok(new ApiResponse(true, "Success", Map.of("answer", answer)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Delete resume
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            resumeService.deleteResume(userDetails.getUsername(), id);
            return ResponseEntity.ok(new ApiResponse(true, "Resume deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
