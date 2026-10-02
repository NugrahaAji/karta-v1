# 🚀 HP3M AI Reasoning Engine - API Integration Guide

Dokumentasi teknis resmi dan panduan integrasi untuk pengembang web (*frontend / backend*) dan AI Coding Assistant (GitHub Copilot, Cursor, ChatGPT, Claude).

**Terakhir diperbarui:** 2 Oktober 2026

---

## 📌 1. Informasi Umum Sistem

* **Nama Layanan:** HP3M AI Reasoning Engine (Microservice)
* **Deskripsi:** Mesin penalaran cerdas (*Neuro-Symbolic AI*) untuk menganalisis tingkat kematangan *Process Mining* organisasi menggunakan kerangka kerja **Holistic Process Mining Maturity Model (HP3M)**.
* **Protokol:** REST API over HTTPS
* **Base URL (Produksi):** `https://reasoning.putra-portfolio.cloud`
* **Base URL (Lokal):** `http://127.0.0.1:8001`
* **Dokumentasi Interaktif (Swagger):** [`https://reasoning.putra-portfolio.cloud/docs`](https://reasoning.putra-portfolio.cloud/docs)
* **Model AI Default:** `agnes-2.5-flash` via [Bynara AI Router](https://router.bynara.id/v1)

---

## ⚡ 2. Quick Start (Tes Cepat dalam 30 Detik)

### Cara Paling Mudah — Buka Swagger UI di Browser
1. Buka: **https://reasoning.putra-portfolio.cloud/docs**
2. Klik tombol hijau **Authorize 🔓** di kanan atas
3. Masukkan API Key: `KunciRahasiaHp3m` → klik **Authorize**
4. Pilih endpoint `POST /api/v1/reasoning/analyze` → klik **Try it out**
5. Paste contoh JSON di bawah → klik **Execute**

### Tes via cURL (Terminal / Git Bash)
```bash
curl -X POST "https://reasoning.putra-portfolio.cloud/api/v1/reasoning/analyze" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: KunciRahasiaHp3m" \
     -d '{
       "assessment": {
         "dimension": "Technology",
         "sub_dimension": "Information Capability",
         "final_result": 3.0,
         "expected_level": 4.0,
         "assessment_note": "Dashboard operasional sudah mendukung prediksi event dan KPI, namun belum mendukung rekomendasi preskriptif otomatis."
       }
     }'
```

### Tes via Postman
1. **Method:** `POST`
2. **URL:** `https://reasoning.putra-portfolio.cloud/api/v1/reasoning/analyze`
3. **Headers:**
   * `Content-Type` → `application/json`
   * `X-API-Key` → `KunciRahasiaHp3m`
4. **Body (raw JSON):** Gunakan contoh JSON di atas.

---

## 🔐 3. Autentikasi (Authentication)

Setiap *request* ke endpoint `/reasoning/*` **WAJIB** menyertakan API Key pada HTTP Header.
Endpoint `/health` bersifat publik dan tidak memerlukan API Key.

```http
X-API-Key: KunciRahasiaHp3m
Content-Type: application/json
```

| Header Key | Tipe | Wajib | Deskripsi |
|---|---|:---:|---|
| `X-API-Key` | String | **YA** | Kunci akses API microservice |
| `Content-Type` | String | **YA** | Harus `application/json` |

> ⚠️ **Kesalahan Paling Umum:** Jika mendapat response `401 Unauthorized`, pastikan header `X-API-Key` terkirim dengan benar. Bukan `Authorization: Bearer ...`, melainkan **`X-API-Key: KunciRahasiaHp3m`**.

---

## 🎯 4. Daftar Endpoint API

### A. Health Check Endpoint (Publik)
Memeriksa status aktif server reasoning engine. **Tidak perlu API Key.**

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

### B. Single Analysis Endpoint
Menganalisis **1 subdimensi** asesmen organisasi.

* **Method:** `POST`
* **Path:** `/api/v1/reasoning/analyze`
* **Autentikasi:** `X-API-Key` (wajib)
* **Timeout Rekomendasi:** `30 detik`

**Request Payload:**
```json
{
  "assessment": {
    "dimension": "Technology",
    "sub_dimension": "Information Capability",
    "final_result": 3.0,
    "expected_level": 4.0,
    "assessment_note": "Catatan bukti temuan dari asesor lapangan."
  }
}
```

**Response `200 OK`:** (Objek tunggal — bukan array)
```json
{
  "classification": "Weakness",
  "strength_weakness": "The evidence confirms that TC has operationalized Level 3 (Predictive) capabilities...",
  "opportunity_analysis": [
    "Advance prescriptive recommendation development from early-stage prototyping to production-ready deployment...",
    "Implement historical-learning feedback loops..."
  ],
  "action_plan": [
    "Commission a dedicated workstream to mature the internal action engine from predictive to prescriptive mode...",
    "Integrate implementation-result feedback data into the machine learning pipeline..."
  ],
  "meta": {
    "provider": "openai",
    "model": "agnes-2.5-flash",
    "inference_time_ms": 10944,
    "usage": {
      "prompt_tokens": 1767,
      "completion_tokens": 1017,
      "total_tokens": 2784
    }
  }
}
```

---

### C. Batch Analysis Endpoint (Endpoint Utama untuk 22 Subdimensi)
Menganalisis **seluruh subdimensi** asesmen organisasi secara paralel (biasanya 22 subdimensi).

* **Method:** `POST`
* **Path:** `/api/v1/reasoning/analyze/batch`
* **Autentikasi:** `X-API-Key` (wajib)
* **Timeout Rekomendasi:** `90 – 120 detik` (Proses paralel 22 subdimensi membutuhkan ~30–60 detik)

**Request Payload:**

> 💡 **Fitur Fleksibilitas Skema (Dual-Schema):**
> * Server menerima array dengan nama kunci `"scores"` maupun `"assessments"`.
> * Server menerima nilai skor dengan nama `"score"` maupun `"final_result"`.
> * Server menerima nilai target dengan nama `"target_level"` maupun `"expected_level"`.
> * Konfigurasi model AI (`provider`) bersifat **opsional**. Server otomatis menggunakan model default (`agnes-2.5-flash` via Bynara AI) jika tidak disertakan.

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

**Response `200 OK`:** (Array objek — urutan sama persis dengan urutan input)
```json
[
  {
    "classification": "Weakness",
    "strength_weakness": "The evidence confirms that TC has operationalized Level 3 (Predictive) capabilities through an internal Action Engine...",
    "opportunity_analysis": [
      "Advance prescriptive recommendation development...",
      "Implement historical-learning feedback loops..."
    ],
    "action_plan": [
      "Commission a dedicated workstream to mature the internal action engine...",
      "Integrate implementation-result feedback data..."
    ],
    "meta": {
      "provider": "openai",
      "model": "agnes-2.5-flash",
      "inference_time_ms": 10944,
      "usage": {
        "prompt_tokens": 1767,
        "completion_tokens": 1017,
        "total_tokens": 2784
      }
    }
  },
  {
    "classification": "Strength",
    "strength_weakness": "The assessor evidence confirms that in-house process mining tools successfully extract data from ongoing systems...",
    "opportunity_analysis": ["..."],
    "action_plan": ["..."],
    "meta": {
      "provider": "openai",
      "model": "agnes-2.5-flash",
      "inference_time_ms": 7970,
      "usage": {
        "prompt_tokens": 1080,
        "completion_tokens": 527,
        "total_tokens": 1607
      }
    }
  }
]
```

---

## 📑 5. Daftar 7 Dimensi & 22 Subdimensi Resmi HP3M

Pastikan nilai string `dimension` dan `sub_dimension` **persis** sesuai daftar berikut (case-sensitive):

| No | Dimension (`dimension`) | Sub-Dimension (`sub_dimension`) | Rentang Level | Skema Nama Level |
|:---:|---|---|:---:|---|
| 1 | **Technology** | `Information Capability` | 1 – 4 | PM Initiated → Prescriptive |
| 2 | **Pipeline** | `Tooling` | 1 – 5 | CMMI (Initial → Optimized) |
| 3 | **Pipeline** | `Integration with Data Source` | 1 – 5 | CMMI |
| 4 | **Pipeline** | `Integration with Operational Application` | 1 – 5 | CMMI |
| 5 | **Data** | `Data Availability` | 1 – 5 | CMMI |
| 6 | **Data** | `Data Security` | 1 – 5 | CMMI |
| 7 | **Data** | `Data Quality` | 1 – 5 | CMMI |
| 8 | **Data** | `Data Explainability` | 1 – 5 | CMMI |
| 9 | **Data** | `Data Privacy` | 1 – 5 | CMMI |
| 10 | **People** | `Skill` | 1 – 5 | CMMI |
| 11 | **People** | `Responsibility` | 1 – 5 | CMMI |
| 12 | **Culture** | `Use Case Availability` | 1 – 5 | CMMI |
| 13 | **Culture** | `Management Involvement` | 1 – 5 | CMMI |
| 14 | **Culture** | `Adaptability` | 1 – 5 | CMMI |
| 15 | **Culture** | `Consistency` | 1 – 5 | CMMI |
| 16 | **Governance** | `Communication` | 1 – 5 | CMMI |
| 17 | **Governance** | `Quality Metric` | 1 – 5 | CMMI |
| 18 | **Governance** | `Documentation System and Compliance Check` | 1 – 5 | CMMI |
| 19 | **Governance** | `Ownership` | 1 – 5 | CMMI |
| 20 | **Strategic Alignment** | `Strategy` | 1 – 5 | CMMI |
| 21 | **Strategic Alignment** | `Budgeting` | 1 – 5 | CMMI |
| 22 | **Strategic Alignment** | `Business Contribution` | 1 – 5 | CMMI |

> **Perbedaan Khusus Dimensi Technology:** Dimensi ini hanya memiliki **4 level** (bukan 5), dan menggunakan nama level sendiri:
> * Level 1: PM Initiated
> * Level 2: Diagnostic and Descriptive
> * Level 3: Predictive
> * Level 4: Prescriptive

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

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AnalysisResult {
  classification: 'Strength' | 'Weakness';
  strength_weakness: string;
  opportunity_analysis: string[];
  action_plan: string[];
  meta?: {
    provider: string;
    model: string;
    inference_time_ms: number;
    usage?: TokenUsage;
  };
}

// services/reasoningEngine.ts
const BASE_URL = 'https://reasoning.putra-portfolio.cloud';
const API_KEY = 'KunciRahasiaHp3m';

// Single Analysis (1 subdimensi)
export async function analyzeSingle(assessment: AssessmentItem): Promise<AnalysisResult> {
  const response = await fetch(`${BASE_URL}/api/v1/reasoning/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ assessment }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reasoning Engine Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// Batch Analysis (22 subdimensi sekaligus)
export async function analyzeBatch(
  organizationName: string,
  scores: AssessmentItem[]
): Promise<AnalysisResult[]> {
  const response = await fetch(`${BASE_URL}/api/v1/reasoning/analyze/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({
      organization: { name: organizationName },
      scores: scores,
    }),
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

    /**
     * Analisis 1 subdimensi HP3M.
     */
    public function analyzeSingle(array $assessment): array
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])
        ->timeout(30)
        ->post("{$this->baseUrl}/api/v1/reasoning/analyze", [
            'assessment' => $assessment,
        ]);

        if ($response->failed()) {
            throw new Exception("Reasoning Engine Error ({$response->status()}): " . $response->body());
        }

        return $response->json();
    }

    /**
     * Analisis seluruh 22 subdimensi HP3M secara batch (paralel).
     */
    public function analyzeBatch(array $scores, string $organizationName = 'Default Org'): array
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])
        ->timeout(120) // Set timeout minimal 90-120 detik untuk batch
        ->post("{$this->baseUrl}/api/v1/reasoning/analyze/batch", [
            'organization' => ['name' => $organizationName],
            'scores' => $scores,
        ]);

        if ($response->failed()) {
            throw new Exception("Reasoning Engine Error ({$response->status()}): " . $response->body());
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

BASE_URL = "https://reasoning.putra-portfolio.cloud"
API_KEY = "KunciRahasiaHp3m"
HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Single Analysis (1 subdimensi)
async def analyze_single(assessment: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/reasoning/analyze",
            json={"assessment": assessment},
            headers=HEADERS
        )
        response.raise_for_status()
        return response.json()

# Batch Analysis (22 subdimensi sekaligus)
async def analyze_batch(
    scores: List[Dict[str, Any]],
    organization_name: str = "Telecom Company"
) -> List[Dict[str, Any]]:
    payload = {
        "organization": {"name": organization_name},
        "scores": scores
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/reasoning/analyze/batch",
            json=payload,
            headers=HEADERS
        )
        response.raise_for_status()
        return response.json()
```

---

### D. cURL (Terminal / Git Bash)

**Single Analysis:**
```bash
curl -X POST "https://reasoning.putra-portfolio.cloud/api/v1/reasoning/analyze" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: KunciRahasiaHp3m" \
     -d '{
       "assessment": {
         "dimension": "Technology",
         "sub_dimension": "Information Capability",
         "final_result": 3.0,
         "expected_level": 4.0,
         "assessment_note": "Dashboard sudah mendukung prediksi event dan KPI."
       }
     }'
```

**Batch Analysis:**
```bash
curl -X POST "https://reasoning.putra-portfolio.cloud/api/v1/reasoning/analyze/batch" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: KunciRahasiaHp3m" \
     -d '{
       "scores": [
         {"dimension":"Technology","sub_dimension":"Information Capability","score":3,"target_level":4,"assessment_note":"..."},
         {"dimension":"Pipeline","sub_dimension":"Tooling","score":4,"target_level":4,"assessment_note":"..."}
       ]
     }'
```

---

## ⚠️ 7. Penanganan Error (Error Handling & HTTP Status)

| Status Code | Arti | Penyebab Umum & Solusi |
|:---:|---|---|
| **`200 OK`** | ✅ Berhasil | Analisis selesai diproses dan mengembalikan JSON. |
| **`401 Unauthorized`** | ❌ Kunci API Salah | Pastikan header `X-API-Key: KunciRahasiaHp3m` terkirim. **Bukan** `Authorization: Bearer ...` |
| **`404 Not Found`** | ❌ Path Salah | Pastikan URL mengandung `/reasoning/` → `/api/v1/reasoning/analyze`. **Bukan** `/api/v1/analyze`. |
| **`422 Unprocessable Entity`** | ❌ Format Payload Salah | Cek apakah body JSON-nya benar. Untuk single: bungkus di `"assessment": {...}`. Untuk batch: bungkus di `"scores": [...]`. |
| **`500 Internal Server Error`** | ❌ Error di AI Provider | Biasanya terjadi jika provider AI (Bynara/Regolo) mengalami *rate limiting* atau timeout. Coba kirim ulang setelah 10–15 detik. |
| **`504 Gateway Timeout`** | ❌ Timeout | Naikkan nilai *HTTP Client Timeout* menjadi minimal 90–120 detik untuk endpoint batch. |

---

## 🐛 8. FAQ & Troubleshooting

### ❓ "Saya dapat `401 Unauthorized`"
**Penyebab:** Header `X-API-Key` tidak dikirim atau nilainya salah.
**Solusi:** Tambahkan header `X-API-Key: KunciRahasiaHp3m` pada setiap request ke endpoint `/reasoning/*`.

### ❓ "Saya dapat `404 Not Found`"
**Penyebab:** URL endpoint salah.
**Solusi:** Pastikan path-nya menggunakan prefix `/reasoning/`:
* ✅ `/api/v1/reasoning/analyze`
* ✅ `/api/v1/reasoning/analyze/batch`
* ❌ `/api/v1/analyze` (salah!)

### ❓ "Saya dapat `422 Unprocessable Entity`"
**Penyebab:** Struktur JSON body tidak sesuai.
**Solusi untuk Single:** Body harus berupa `{ "assessment": { ... } }`, bukan langsung `{ "dimension": "...", ... }`.
**Solusi untuk Batch:** Body harus memiliki key `"scores"` atau `"assessments"` berisi array.

### ❓ "Saya dapat `Connection Refused` atau `ERR_CONNECTION_REFUSED`"
**Penyebab:** Anda menembak `localhost:8001` dari komputer lain (bukan dari server VPS).
**Solusi:** Gunakan URL produksi: `https://reasoning.putra-portfolio.cloud`

### ❓ "Response-nya lama (> 30 detik)"
**Penyebab:** Endpoint batch menganalisis 22 subdimensi secara paralel, masing-masing membutuhkan ~5–15 detik inferensi AI.
**Solusi:** Set timeout minimal **90–120 detik** di HTTP client Anda.

### ❓ "Provider AI bisa diganti?"
**Bisa.** Tambahkan objek `"provider"` di request body:
```json
{
  "provider": {
    "name": "openai",
    "model": "nama-model",
    "endpoint": "https://api-endpoint.com/v1",
    "api_key": "sk-xxx"
  },
  "assessment": { ... }
}
```
Jika `"provider"` tidak disertakan, server otomatis menggunakan `agnes-2.5-flash` via Bynara AI.

---

## 🤖 9. Catatan Khusus untuk AI Assistant (Prompt Context)

Jika Anda menggunakan GitHub Copilot, Cursor, atau ChatGPT untuk membantu koding:
1. Layanan ini adalah **stateless microservice**. Tidak perlu mengelola session di backend reasoning engine.
2. Ada **2 endpoint utama**: Single (`/reasoning/analyze`) untuk 1 subdimensi, dan Batch (`/reasoning/analyze/batch`) untuk 22 subdimensi sekaligus.
3. Seluruh request ke endpoint reasoning **wajib menyertakan** header `X-API-Key: KunciRahasiaHp3m`.
4. Output selalu mengembalikan struktur 5 atribut per subdimensi: `classification`, `strength_weakness`, `opportunity_analysis`, `action_plan`, dan `meta`.
5. Nilai `classification` hanya berisi `"Strength"` (Gap = 0) atau `"Weakness"` (Gap > 0). Tidak pernah mengembalikan `"Mixed"`.
6. Field `meta.usage` berisi informasi token usage (`prompt_tokens`, `completion_tokens`, `total_tokens`) yang berguna untuk monitoring biaya.
