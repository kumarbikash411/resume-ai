package com.resumeai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class OpenAiService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Value("${openai.model}")
    private String model;

    @Value("${openai.max-tokens}")
    private int maxTokens;

    private WebClient getWebClient() {
        return WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String analyzeResume(String resumeText) {
        String systemPrompt = """
                You are an expert HR recruiter and career coach with 15+ years of experience.
                Analyze the provided resume and give detailed, actionable feedback.
                
                Return your analysis in the following JSON format:
                {
                  "overallScore": <number 0-100>,
                  "summary": "<2-3 sentence overall assessment>",
                  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
                  "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
                  "sections": {
                    "contact": {"score": <0-10>, "feedback": "<feedback>"},
                    "summary": {"score": <0-10>, "feedback": "<feedback>"},
                    "experience": {"score": <0-10>, "feedback": "<feedback>"},
                    "education": {"score": <0-10>, "feedback": "<feedback>"},
                    "skills": {"score": <0-10>, "feedback": "<feedback>"}
                  },
                  "keywordsFound": ["<keyword1>", "<keyword2>"],
                  "missingKeywords": ["<keyword1>", "<keyword2>"],
                  "atsCompatibility": {"score": <0-100>, "feedback": "<feedback>"},
                  "suggestedJobTitles": ["<title1>", "<title2>", "<title3>"]
                }
                
                Be specific and actionable. Return ONLY valid JSON, no markdown.
                """;

        String userPrompt = "Please analyze this resume:\n\n" + resumeText;

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        try {
            Map<?, ?> response = getWebClient()
                    .post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("choices")) {
                List<?> choices = (List<?>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                    Map<?, ?> message = (Map<?, ?>) choice.get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
            throw new RuntimeException("AI analysis failed: " + e.getMessage());
        }

        throw new RuntimeException("Empty response from OpenAI");
    }

    public String chatWithResume(String resumeText, String userQuestion) {
        String systemPrompt = """
                You are a helpful career advisor. You have been given a resume to analyze.
                Answer questions about this resume helpfully and professionally.
                Keep responses concise (under 200 words) unless more detail is requested.
                """;

        String userPrompt = "Resume:\n" + resumeText + "\n\nQuestion: " + userQuestion;

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 500,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        try {
            Map<?, ?> response = getWebClient()
                    .post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("choices")) {
                List<?> choices = (List<?>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                    Map<?, ?> message = (Map<?, ?>) choice.get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("OpenAI chat failed: {}", e.getMessage());
            throw new RuntimeException("Chat failed: " + e.getMessage());
        }

        throw new RuntimeException("Empty response from OpenAI");
    }
}
