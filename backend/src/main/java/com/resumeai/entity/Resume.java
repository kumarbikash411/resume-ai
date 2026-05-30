package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String storedFileName;

    @Column(nullable = false)
    private String filePath;

    private String fileType;

    private Long fileSize;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Column(columnDefinition = "TEXT")
    private String aiAnalysis;

    @Column(columnDefinition = "TEXT")
    private String aiScore;

    @Enumerated(EnumType.STRING)
    private ResumeStatus status;

    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    private LocalDateTime analyzedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        status = ResumeStatus.UPLOADED;
    }

    public enum ResumeStatus {
        UPLOADED, PROCESSING, ANALYZED, FAILED
    }
}
