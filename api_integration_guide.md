# 🚀 HP3M AI Reasoning Engine - API Integration Guide

Dokumentasi teknis resmi dan panduan integrasi untuk pengembang web (*frontend / backend*) dan AI Coding Assistant (GitHub Copilot, Cursor, ChatGPT, Claude).

---

## 📌 1. Informasi Umum Sistem

* **Nama Layanan:** HP3M AI Reasoning Engine (Microservice)
* **Deskripsi:** Mesin penalaran cerdas (*Neuro-Symbolic AI*) untuk menganalisis tingkat kematangan *Process Mining* organisasi menggunakan kerangka kerja **Holistic Process Mining Maturity Model (HP3M)**.
* **Protokol:** REST API over HTTPS
* **Base URL:** `https://reasoning.putra-portfolio.cloud`
* **Dokumentasi Interaktif (Swagger):** `https://reasoning.putra-portfolio.cloud/docs`

---

## 🔐 2. Autentikasi (Authentication)

Setiap *request* wajib menyertakan API Key pada HTTP Header:

```http
X-API-Key: KunciRahasiaHp3m
Content-Type: application/json
```

| Header Key | Tipe | Wajib | Deskripsi |
|---|---|:---:|---|
| `X-API-Key` | String | **YA** | Kunci akses API microservice |
| `Content-Type` | String | **YA** | Harus `application/json` |

---

## 🎯 3. Daftar Endpoint API

### A. Health Check Endpoint
Memeriksa status aktif server reasoning engine.

* **Method:** `GET`
* **Path:** `/api/v1/health`
* **Response `200 OK`:**
```json
{
  "status": "ok",
  "service": "hp3m-reasoning-engine"
}
```

---

### B. Batch Analysis Endpoint (Endpoint Utama)
Menganalisis seluruh subdimensi asesmen organisasi secara paralel (biasanya 22 subdimensi).

* **Method:** `POST`
* **Path:** `/api/v1/reasoning/analyze/batch`
* **Timeout Rekomendasi:** `60 - 90 detik` (Proses paralel 22 subdimensi membutuhkan ~15–25 detik).

---

## 📦 4. Spesifikasi Kontrak Data (Request & Response)

### A. Request Payload (Format yang Dikirim Web)

> 💡 **Fitur Fleksibilitas Skema (Dual-Schema):**
> * Server menerima array dengan nama kunci `"scores"` maupun `"assessments"`.
> * Server menerima nilai skor dengan nama `"score"` maupun `"final_result"`.
> * Server menerima nilai target dengan nama `"target_level"` maupun `"expected_level"`.
> * Konfigurasi model AI (`provider`) bersifat **opsional**. Server otomatis menggunakan model terbaik (`Llama-3.3-70B-Instruct`) jika tidak disertakan.

#### Contoh Request JSON (Paling Bersih & Direkomendasikan):

```json
{
  "organization": {
    "name": "Telecom Company (TC)",
    "sector": "Telecommunication"
  },
  "scores": [
    {
      "dimension": "Technology",
      "sub_dimension": "Information Capability",
      "score": 3,
      "target_level": 4,
      "assessment_note": "Dashboard operasional sudah mendukung prediksi event dan KPI, namun belum mendukung rekomendasi preskriptif otomatis."
    },
    {
      "dimension": "Pipeline",
      "sub_dimension": "Tooling",
      "score": 4,
      "target_level": 4,
      "assessment_note": "Alat process mining in-house sudah terintegrasi dan menghasilkan alert otomatis untuk logistik."
    }
    // ... total 22 subdimensi lengkap
  ]
}
```

---

### B. Response Payload (Format yang Diterima Web)

Server mengembalikan array objek hasil analisis dengan urutan yang sama persis dengan urutan input yang dikirim:

```json
[
  {
    "classification": "Weakness",
    "strength_weakness": "The current technology capability is at Level 3, where process mining results have predictive capability using AI, and the dashboard provides value with SLA/KPIs that align with business strategy. However, the organization still lacks the ability to provide automatic prescriptive recommendations, which is a key characteristic of Level 4.",
    "opportunity_analysis": [
      "Developing automatic prescriptive recommendations to provide optimal conditional actions",
      "Integrating AI-powered predictive analytics with decision-making processes",
      "Enhancing the Action Engine to support quantitative management and optimization"
    ],
    "action_plan": [
      "Conduct a thorough review of the current Action Engine to identify areas for improvement",
      "Develop a roadmap for integrating automatic prescriptive recommendations into the existing system",
      "Collaborate with stakeholders to define key performance indicators and metrics",
      "Provide training and support for employees to ensure they can effectively utilize the new capabilities"
    ],
    "meta": {
      "provider": "openai",
      "model": "Llama-3.3-70B-Instruct",
      "inference_time_ms": 18450
    }
  },
  {
    "classification": "Strength",
    "strength_weakness": "The organization has demonstrated a strong capability in utilizing in-house process mining tools to gather data from ongoing systems, visualize it, and provide automated alerts, which aligns with Level 4.",
    "opportunity_analysis": [
      "Optimizing current tooling to enhance predictive analytics",
      "Expanding the use of in-house tools to other business areas"
    ],
    "action_plan": [
      "Conduct regular reviews of in-house tools to ensure continued alignment",
      "Establish a maintenance schedule to update and refine tools and prevent regression"
    ],
    "meta": {
      "provider": "openai",
      "model": "Llama-3.3-70B-Instruct",
      "inference_time_ms": 19120
    }
  }
]
```

---

## 📑 5. Daftar 7 Dimensi & 22 Subdimensi Resmi HP3M

Pastikan nilai string `dimension` dan `sub_dimension` persis sesuai daftar berikut:

| No | Dimension (`dimension`) | Sub-Dimension (`sub_dimension`) | Rentang Level |
|:---:|---|---|:---:|
| 1 | **Technology** | `Information Capability` | 1 – 4 |
| 2 | **Pipeline** | `Tooling` | 1 – 5 |
| 3 | **Pipeline** | `Integration with Data Source` | 1 – 5 |
| 4 | **Pipeline** | `Integration with Operational Application` | 1 – 5 |
| 5 | **Data** | `Data Availability` | 1 – 5 |
| 6 | **Data** | `Data Security` | 1 – 5 |
| 7 | **Data** | `Data Quality` | 1 – 5 |
| 8 | **Data** | `Data Explainability` | 1 – 5 |
| 9 | **Data** | `Data Privacy` | 1 – 5 |
| 10 | **People** | `Skill` | 1 – 5 |
| 11 | **People** | `Responsibility` | 1 – 5 |
| 12 | **Culture** | `Use Case Availability` | 1 – 5 |
| 13 | **Culture** | `Management Involvement` | 1 – 5 |
| 14 | **Culture** | `Adaptability` | 1 – 5 |
| 15 | **Culture** | `Consistency` | 1 – 5 |
| 16 | **Governance** | `Communication` | 1 – 5 |
| 17 | **Governance** | `Quality Metric` | 1 – 5 |
| 18 | **Governance** | `Documentation System and Compliance Check` | 1 – 5 |
| 19 | **Governance** | `Ownership` | 1 – 5 |
| 20 | **Strategic Alignment** | `Strategy` | 1 – 5 |
| 21 | **Strategic Alignment** | `Budgeting` | 1 – 5 |
| 22 | **Strategic Alignment** | `Business Contribution` | 1 – 5 |

---

## 💻 6. Contoh Kode Integrasi (Code Examples)

### A. TypeScript / Next.js / React
```typescript
// types/hp3m.ts
export interface AssessmentItem {
  dimension: string;
  sub_dimension: string;
  score: number; // Kondisi saat ini (1-5)
  target_level: number; // Target level (1-5)
  assessment_note?: string; // Catatan bukti / kondisi riil
}

export interface AnalysisResult {
  classification: 'Strength' | 'Weakness' | 'Mixed';
  strength_weakness: string;
  opportunity_analysis: string[];
  action_plan: string[];
  meta?: {
    model: string;
    inference_time_ms: number;
  };
}

// services/reasoningEngine.ts
export async function analyzeHp3mAssessment(
  organizationName: string,
  scores: AssessmentItem[]
): Promise<AnalysisResult[]> {
  const response = await fetch('https://reasoning.putra-portfolio.cloud/api/v1/reasoning/analyze/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'KunciRahasiaHp3m'
    },
    body: JSON.stringify({
      organization: { name: organizationName },
      scores: scores
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reasoning Engine Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}
```

---

### B. PHP / Laravel
```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class ReasoningEngineService
{
    protected string $baseUrl = 'https://reasoning.putra-portfolio.cloud';
    protected string $apiKey = 'KunciRahasiaHp3m';

    public function analyzeBatch(array $scores, string $organizationName = 'Default Org'): array
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])
        ->timeout(90) // Set timeout minimal 60-90 detik
        ->post("{$this->baseUrl}/api/v1/reasoning/analyze/batch", [
            'organization' => ['name' => $organizationName],
            'scores' => $scores,
        ]);

        if ($response->failed()) {
            throw new Exception("Reasoning Engine Error: " . $response->body());
        }

        return $response->json();
    }
}
```

---

### C. Python / FastAPI / Flask
```python
import httpx
from typing import List, Dict, Any

REASONING_API_URL = "https://reasoning.putra-portfolio.cloud/api/v1/reasoning/analyze/batch"
REASONING_API_KEY = "KunciRahasiaHp3m"

async def analyze_assessment(scores: List[Dict[str, Any]], organization_name: str = "Telecom Company") -> List[Dict[str, Any]]:
    payload = {
        "organization": {"name": organization_name},
        "scores": scores
    }
    
    headers = {
        "X-API-Key": REASONING_API_KEY,
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(REASONING_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
```

---

## ⚠️ 7. Penanganan Error (Error Handling & HTTP Status)

| Status Code | Arti | Penyebab Umum & Solusi |
|:---:|---|---|
| **`200 OK`** | Berhasil | Analisis selesai diproses dan mengembalikan JSON array. |
| **`401 Unauthorized`** | Kunci API Salah | Pastikan header `X-API-Key: KunciRahasiaHp3m` terkirim dengan benar. |
| **`422 Unprocessable`** | Format Data Salah | Cek apakah ada field `score` yang bernilai bukan angka atau `dimension` kosong. |
| **`504 Gateway Timeout`** | Timeout | Naikkan nilai *HTTP Client Timeout* di aplikasi pemanggil menjadi minimal 60–90 detik. |

---

## 🤖 8. Catatan Khusus untuk AI Assistant (Prompt Context)

Jika Anda menggunakan GitHub Copilot, Cursor, atau ChatGPT untuk membantu koding:
1. Layanan ini adalah **stateless microservice**. Tidak perlu mengelola session di backend reasoning engine.
2. Seluruh 22 subdimensi sebaiknya dikirim sekaligus dalam 1 kali pemanggilan `POST /api/v1/reasoning/analyze/batch`.
3. Output selalu mengembalikan struktur 4 atribut per subdimensi: `classification`, `strength_weakness`, `opportunity_analysis`, dan `action_plan`.
