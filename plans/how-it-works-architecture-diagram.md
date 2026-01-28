# Neural Network Architecture - Visual Diagram

## System Topology Overview

```mermaid
flowchart TB
    subgraph Layer1["Layer 1: User Interface"]
        direction LR
        U1["👤 User<br/>Fiducial Team"] 
        U2["🌐 Web Chat<br/>Primary Interface"]
        U3["💬 Teams<br/>Microsoft Teams"]
    end
    
    subgraph Layer2["Layer 2: Gateway Hub"]
        direction TB
        G1["⚡ Clawdbot Gateway<br/>:18789 Loopback"]
        G2["🔒 Tailscale Funnel<br/>Secure Tunnel"]
    end
    
    subgraph Layer3["Layer 3: AI Core"]
        direction LR
        A1["🧠 Work Agent<br/>Claude Sonnet"]
        A2["💾 Sessions<br/>39 Active"]
        A3["🗄️ Memory<br/>Vector DB + FTS"]
    end
    
    subgraph Layer4["Layer 4: Knowledge Base"]
        direction TB
        K1["📋 AGENTS.md"]
        K2["✨ SOUL.md"]
        K3["👤 USER.md"]
        K4["🆔 IDENTITY.md"]
        K5["🛠️ TOOLS.md"]
    end
    
    subgraph Layer5["Layer 5: External Services"]
        direction LR
        E1["✨ Anthropic<br/>Claude API"]
        E2["☁️ Azure<br/>Bot Service"]
        E3["🔐 Supabase<br/>Auth + DB"]
        E4["▲ Vercel<br/>Deployment"]
    end
    
    %% Connections
    U1 -.->|Access| U2
    U1 -.->|Access| U3
    U2 ==>|<span style='color:#be1e2c'>WebSocket</span>| G1
    U3 ==>|<span style='color:#be1e2c'>HTTPS :3978</span>| G2
    G2 -.->|Tunnel| G1
    G1 ==>|<span style='color:#be1e2c'>Process</span>| A1
    G1 -.->|Store| A2
    G1 -.->|Query| A3
    A1 -.->|Read| K1
    A1 -.->|Read| K2
    A1 -.->|Read| K3
    A1 -.->|Read| K4
    A1 -.->|Read| K5
    A1 ==>|<span style='color:#be1e2c'>API Call</span>| E1
    U3 -.->|Integrate| E2
    G1 -.->|Auth| E3
    U2 -.->|Host| E4
    
    %% Styling
    style Layer1 fill:#e0f2fe,stroke:#3b82f6,stroke-width:2px
    style Layer2 fill:#f3e8ff,stroke:#8b5cf6,stroke-width:2px
    style Layer3 fill:#fee2e2,stroke:#be1e2c,stroke-width:3px
    style Layer4 fill:#ffedd5,stroke:#f97316,stroke-width:2px
    style Layer5 fill:#d1fae5,stroke:#10b981,stroke-width:2px
    
    style A1 fill:#fecaca,stroke:#be1e2c,stroke-width:4px
    style G1 fill:#ddd6fe,stroke:#8b5cf6,stroke-width:3px
    style U2 fill:#bfdbfe,stroke:#3b82f6,stroke-width:2px
```

## Scroll Journey Flow

```mermaid
flowchart LR
    subgraph ScrollProgress["Scroll Progress"]
        direction TB
        S0["0% - Hero"]
        S1["10% - User Layer"]
        S2["25% - Channels"]
        S3["40% - Gateway"]
        S4["55% - AI Core"]
        S5["70% - Workspace"]
        S6["85% - Data Flow"]
        S7["95% - Security"]
        S8["100% - CTA"]
    end
    
    subgraph Activation["Node Activation"]
        direction TB
        A0["Network Initialize"]
        A1["User Nodes Glow"]
        A2["Channels Connect"]
        A3["Hub Activates"]
        A4["Neural Pulse"]
        A5["Memory Cells Light"]
        A6["Signal Flow"]
        A7["Shield Forms"]
        A8["Complete"]
    end
    
    S0 -.-> A0
    S1 -.-> A1
    S2 -.-> A2
    S3 -.-> A3
    S4 -.-> A4
    S5 -.-> A5
    S6 -.-> A6
    S7 -.-> A7
    S8 -.-> A8
    
    style S4 fill:#fecaca,stroke:#be1e2c,stroke-width:3px
    style A4 fill:#fecaca,stroke:#be1e2c,stroke-width:3px
```

## Neural Network Data Flow Animation

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Web Chat
    participant GW as Gateway
    participant AI as Work Agent
    participant Mem as Memory
    participant API as Claude API
    
    Note over User,API: Scroll Section: Data Flow
    
    User->>Web: Type Message
    activate Web
    Web->>Web: Animate Input Node
    Web->>GW: WebSocket Send
    deactivate Web
    
    activate GW
    GW->>GW: Path Animation
    GW->>Mem: Query Context
    activate Mem
    Mem-->>GW: Return History
    deactivate Mem
    GW->>AI: Forward Request
    deactivate GW
    
    activate AI
    AI->>AI: Neural Pulse Effect
    AI->>API: API Call
    activate API
    API-->>AI: Stream Response
    deactivate API
    AI->>AI: Process & Format
    AI-->>GW: Return Message
    deactivate AI
    
    activate GW
    GW->>GW: Response Path
    GW-->>Web: WebSocket Receive
    deactivate GW
    
    activate Web
    Web->>Web: Output Node Pulse
    Web-->>User: Display Response
    deactivate Web
```

## Component Hierarchy

```mermaid
graph TD
    Page["/how-it-works/page.tsx"] --> Container["NeuralNetworkContainer"]
    
    Container --> Progress["ProgressIndicator"]
    Container --> Hero["HeroSection"]
    Container --> User["UserLayerSection"]
    Container --> Gateway["GatewayLayerSection"]
    Container --> AICore["AICoreSection"]
    Container --> Workspace["WorkspaceSection"]
    Container --> DataFlow["DataFlowSection"]
    Container --> Security["SecuritySection"]
    
    Hero --> Particles["ParticleField"]
    User --> Node1["NeuralNode: User"]
    User --> Node2["NeuralNode: WebChat"]
    User --> Node3["NeuralNode: Teams"]
    
    Gateway --> Node4["NeuralNode: Gateway"]
    Gateway --> Node5["NeuralNode: Tailscale"]
    Gateway --> Conn1["SynapseConnection"]
    
    AICore --> Node6["NeuralNode: WorkAgent"]
    AICore --> Node7["NeuralNode: Sessions"]
    AICore --> Node8["NeuralNode: Memory"]
    AICore --> Conn2["SynapseConnection"]
    AICore --> Conn3["SynapseConnection"]
    
    Workspace --> Node9["NeuralNode: AGENTS"]
    Workspace --> Node10["NeuralNode: SOUL"]
    Workspace --> Node11["NeuralNode: TOOLS"]
    
    DataFlow --> Animation["PathAnimation"]
    DataFlow --> Pulse["DataPulse"]
    
    Security --> Shield["ShieldOverlay"]
    
    Node1 --> Detail1["DetailPanel"]
    Node4 --> Detail2["DetailPanel"]
    Node6 --> Detail3["DetailPanel"]
    
    style Container fill:#f3e8ff,stroke:#8b5cf6
    style AICore fill:#fee2e2,stroke:#be1e2c,stroke-width:3px
    style Node6 fill:#fecaca,stroke:#be1e2c,stroke-width:3px
```

## Z-Depth Layer Visualization

```mermaid
graph LR
    subgraph ZLayers["Z-Depth Stack"]
        direction TB
        Z3["z-index: 20<br/>UI Overlay<br/>Progress Indicator"] 
        Z2["z-index: 10<br/>Content Layer<br/>Text & Details"]
        Z1["z-index: 0<br/>Node Layer<br/>Neural Nodes"]
        Z0["z-index: -10<br/>Connection Layer<br/>Synapse Paths"]
        Z_1["z-index: -20<br/>Particle Layer<br/>Ambient Effects"]
        Z_2["z-index: -30<br/>Background<br/>Gradient Mesh"]
    end
    
    subgraph Parallax["Parallax Speed"]
        direction TB
        P3["1.5x - Fast"]
        P2["1.2x - Content"]
        P1["1.0x - Base"]
        P0["0.4x - Connections"]
        P_1["0.2x - Slow"]
        P_2["0.1x - Background"]
    end
    
    Z3 -.-> P3
    Z2 -.-> P2
    Z1 -.-> P1
    Z0 -.-> P0
    Z_1 -.-> P_1
    Z_2 -.-> P_2
    
    style Z3 fill:#ddd6fe
    style Z2 fill:#e0e7ff
    style Z1 fill:#dbeafe
    style Z0 fill:#d1fae5
    style Z_1 fill:#fef3c7
    style Z_2 fill:#fee2e2
```

## Animation State Machine

```mermaid
stateDiagram-v2
    [*] --> Dormant: Page Load
    
    Dormant --> Activating: Scroll Into View
    Activating --> Active: Animation Complete
    Active --> Pulsing: Data Transmission
    Pulsing --> Active: Pulse Complete
    Active --> Dormant: Scroll Out of View
    
    state Dormant {
        [*] --> Hidden
        Hidden : opacity: 0.3
        Hidden : scale: 0.7
        Hidden : filter: brightness(0.5)
    }
    
    state Activating {
        [*] --> Growing
        Growing : Spring animation
        Growing : 600ms duration
        Growing : scale 0.7 → 1.0
    }
    
    state Active {
        [*] --> Breathing
        Breathing : Continuous loop
        Breathing : 3s duration
        Breathing : Gentle glow pulse
    }
    
    state Pulsing {
        [*] --> Flash
        Flash : Single pulse
        Flash : 400ms duration
        Flash : scale 1.0 → 1.2 → 1.0
    }
```

## Responsive Layout Evolution

```mermaid
graph TB
    subgraph Desktop["Desktop ≥1280px"]
        direction TB
        D1["Full Neural Network"]
        D2["3D Depth Layers"]
        D3["Side-by-Side Layout"]
        D4["All Particles"]
    end
    
    subgraph Tablet["Tablet 768-1279px"]
        direction TB
        T1["Simplified Network"]
        T2["2 Parallax Layers"]
        T3["Stacked Layout"]
        T4["50% Particles"]
    end
    
    subgraph Mobile["Mobile <768px"]
        direction TB
        M1["Vertical Timeline"]
        M2["No Parallax"]
        M3["Single Column"]
        M4["Minimal Particles"]
    end
    
    Desktop -->|Scale Down| Tablet
    Tablet -->|Scale Down| Mobile
    
    style Desktop fill:#dbeafe,stroke:#3b82f6
    style Tablet fill:#fef3c7,stroke:#f59e0b
    style Mobile fill:#fecaca,stroke:#ef4444
```
