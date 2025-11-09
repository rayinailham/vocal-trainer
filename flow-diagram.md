# Vocal Range Detection - Flow Diagram Baru

## Current Flow vs New Flow Comparison

### Current Flow (6 Steps)
```
┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│   Idle  │───▶│ Permission  │───▶│ Lowest   │───▶│ Highest  │───▶│Processing │───▶│ Complete │
└─────────┘    └─────────────┘    └──────────┘    └──────────┘    └───────────┘    └──────────┘
```

### New Flow (4 Steps)
```
┌────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│ Setup  │───▶│ Practice │───▶│ Record   │───▶│ Results │
└────────┘    └──────────┘    └──────────┘    └─────────┘
```

## Detailed Flow Diagram

```mermaid
graph TD
    A[Start] --> B[Setup Phase]
    B --> C{Microphone Available?}
    C -->|No| D[Request Permission]
    C -->|Yes| E[Show Microphone Selector]
    D --> F{Permission Granted?}
    F -->|No| G[Show Error Message]
    F -->|Yes| E
    E --> H[User Selects Mic]
    H --> I[Initialize Audio]
    I --> J[Practice Phase]
    
    J --> K[Start Continuous Monitoring]
    K --> L[Show Real-time Visualizer]
    L --> M[User Practices Singing]
    M --> N{User Ready?}
    N -->|No| M
    N -->|Yes| O[Recording Phase]
    
    O --> P[Show Guided Instructions]
    P --> Q[Start One-Shot Recording]
    Q --> R[Sing Lowest Note]
    R --> S[Auto-detect Lowest]
    S --> T[Sing Highest Note]
    T --> U[Auto-detect Highest]
    U --> V[Calculate Range]
    V --> W[Results Phase]
    
    W --> X[Display Vocal Range]
    X --> Y[Show Piano Keyboard]
    Y --> Z[Voice Type Classification]
    Z --> AA{User Action}
    AA -->|Save| AB[Save to Local Storage]
    AA -->|Retake| J
    AA -->|Close| AC[End]
    
    AB --> AD[Show Success Message]
    AD --> AC
    G --> AC
```

## Component Interaction Diagram

```mermaid
graph LR
    subgraph "VocalRangePage"
        A[State Management]
        B[Flow Control]
    end
    
    subgraph "Components"
        C[MicrophoneSelector]
        D[AudioVisualizer]
        E[GuidedRecording]
        F[RangeDisplay]
        G[PianoKeyboard]
    end
    
    subgraph "Audio Processing"
        H[AudioProcessor]
        I[RangeDetector]
    end
    
    subgraph "Storage"
        J[Local Storage]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
    
    C --> H
    D --> H
    E --> H
    E --> I
    H --> I
    
    F --> J
    I --> F
```

## State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> Setup
    Setup --> Practice: Start Practice
    Practice --> Recording: Start Recording
    Recording --> Results: Recording Complete
    Results --> Practice: Retake Test
    Results --> Setup: Change Microphone
    Results --> [*]: Close
    
    state Practice {
        [*] --> Monitoring
        Monitoring --> Monitoring: Continuous Pitch Detection
    }
    
    state Recording {
        [*] --> LowestNote
        LowestNote --> HighestNote: Lowest Detected
        HighestNote --> [*]: Highest Detected
    }
```

## User Experience Flow

### Setup Phase
1. User membuka halaman
2. Sistem menampilkan daftar microphone yang tersedia
3. User memilih microphone
4. Sistem meminta permission jika belum diberikan
5. Audio context diinisialisasi

### Practice Phase
1. Visualizer aktif secara kontinyu
2. User bisa bernyanyi untuk melihat pitch real-time
3. Tidak ada data yang disimpan
4. User bisa berlatih sebanyak yang diinginkan
5. Tombol "Start Recording" untuk melanjutkan

### Recording Phase
1. Sistem menampilkan instruksi panduan
2. User diminta menyanyikan nada terendah
3. Sistem auto-detect ketika nada stabil
4. User diminta menyanyikan nada tertinggi
5. Sistem auto-detect ketika nada stabil
6. Sistem menghitung range vokal

### Results Phase
1. Tampilkan nada terendah dan tertinggi
2. Tampilkan piano keyboard dengan highlighted range
3. Tampilkan voice type classification
4. Opsi untuk menyimpan hasil
5. Opsi untuk mengulang test

## Technical Implementation Flow

### Audio Processing Flow
```mermaid
sequenceDiagram
    participant U as User
    participant P as VocalRangePage
    participant A as AudioProcessor
    participant V as AudioVisualizer
    participant R as RangeDetector
    
    P->>A: initialize(deviceId)
    A-->>P: permission granted
    
    P->>A: startMonitoring()
    loop Practice Mode
        A->>R: processPitch(frequency)
        R-->>A: pitchResult
        A-->>P: onPitchDetected(result)
        P->>V: updateVisualization(result)
    end
    
    P->>A: startRangeDetection()
    loop Recording Mode
        A->>R: addReading(frequency, confidence)
        R->>R: updateMinMax()
        R-->>A: progressUpdate(min, max)
        A-->>P: onProgress(min, max)
    end
    R-->>A: rangeComplete
    A-->>P: onRangeComplete(range)
```

### Data Flow
```mermaid
graph TD
    A[Audio Input] --> B[Meyda Analysis]
    B --> C[Pitch Detection]
    C --> D[Frequency Processing]
    D --> E[Range Calculation]
    E --> F[Results Display]
    F --> G[Local Storage]
    
    H[User Settings] --> I[Microphone Selection]
    I --> J[Audio Context]
    J --> A
    
    K[Visual Feedback] --> L[AudioVisualizer]
    C --> L
    L --> M[Real-time Display]
```

## Error Handling Flow

```mermaid
graph TD
    A[Start Operation] --> B{Error Occurred?}
    B -->|No| C[Continue Operation]
    B -->|Yes| D{Error Type}
    
    D -->|Permission Denied| E[Show Permission Error]
    D -->|Device Not Found| F[Show Device Error]
    D -->|Audio Context Failed| G[Show Audio Error]
    D -->|Network Error| H[Show Network Error]
    
    E --> I[Request Permission Again]
    F --> J[Show Device Selector]
    G --> K[Retry Audio Initialization]
    H --> L[Retry Operation]
    
    I --> M{Retry Success?}
    J --> M
    K --> M
    L --> M
    
    M -->|Yes| C
    M -->|No| N[Show Fallback Option]
    N --> O[Continue with Limited Features]
```

## Performance Optimization Flow

```mermaid
graph LR
    A[Audio Stream] --> B[Buffer Management]
    B --> C[Pitch Detection]
    C --> D[Confidence Filtering]
    D --> E[Range Tracking]
    E --> F[UI Updates]
    
    G[Performance Monitor] --> H{CPU Usage > 80%?}
    H -->|Yes| I[Reduce Update Rate]
    H -->|No| J[Maintain 60fps]
    
    I --> K[Update Every 100ms]
    J --> L[Update Every 50ms]
    
    K --> F
    L --> F