package com.resumeai.dto;

import com.resumeai.entity.Resume;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResumeDto {
    private Long id;
    private String originalFileName;
    private String fileType;
    private Long fileSize;
    private String aiAnalysis;
    private String aiScore;
    private Resume.ResumeStatus status;
    private LocalDateTime uploadedAt;
    private LocalDateTime analyzedAt;

    public static ResumeDto from(Resume resume) {
        ResumeDto dto = new ResumeDto();
        dto.setId(resume.getId());
        dto.setOriginalFileName(resume.getOriginalFileName());
        dto.setFileType(resume.getFileType());
        dto.setFileSize(resume.getFileSize());
        dto.setAiAnalysis(resume.getAiAnalysis());
        dto.setAiScore(resume.getAiScore());
        dto.setStatus(resume.getStatus());
        dto.setUploadedAt(resume.getUploadedAt());
        dto.setAnalyzedAt(resume.getAnalyzedAt());
        return dto;
    }
}
