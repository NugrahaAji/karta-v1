// HP3M Tool Phase 3 - All 7 Dimensions Seeder Data (bobot auto-computed by level position)
const dimensionSeedData = [
  {
    name: "Technology",
    detail: "Technology dimension for process mining maturity assessment",
    subdimensions: [
      {
        name: "Information Capability",
        detail: "Ability to extract, analyze, and leverage information from process mining tools",
        levels: [
          {
            name: "Level 1 - Initial / PM Initiated",
            detail: "Basic process mining adoption with minimal technology capabilities",
            criteria: [
              { name: "Basic data extraction", detail: "Organization can extract basic event logs from operational systems" },
              { name: "Simple visualization", detail: "Basic process flow visualization is available" },
            ],
          },
          {
            name: "Level 2 - Repeatable / PM Repeated",
            detail: "Standardized technology usage across teams",
            criteria: [
              { name: "Standardized tools", detail: "Process mining tools are standardized across departments" },
              { name: "Automated extraction", detail: "Data extraction processes are partially automated" },
            ],
          },
          {
            name: "Level 3 - Defined / PM Managed",
            detail: "Well-defined technology framework for process mining",
            criteria: [
              { name: "Advanced analytics", detail: "Advanced process analytics including conformance checking" },
              { name: "Integration framework", detail: "Technology is integrated with enterprise systems" },
            ],
          },
          {
            name: "Level 4 - Managed / PM Optimized",
            detail: "Optimized and measured technology capabilities",
            criteria: [
              { name: "Predictive analytics", detail: "Predictive algorithms forecast process behavior and bottlenecks" },
              { name: "Real-time monitoring", detail: "Real-time process monitoring dashboards are operational" },
            ],
          },
          {
            name: "Level 5 - Optimizing / PM Innovating",
            detail: "Continuously innovating technology capabilities",
            criteria: [
              { name: "AI-driven insights", detail: "AI and machine learning provide automated process improvement recommendations" },
              { name: "Continuous innovation", detail: "Technology stack is continuously evaluated and upgraded" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Pipeline",
    detail: "Pipeline dimension covering tooling, data source integration, and operational application integration",
    subdimensions: [
      {
        name: "Tooling",
        detail: "Process mining tool selection, deployment, and management",
        levels: [
          { name: "Level 1 - Initial", detail: "Ad-hoc tool usage", criteria: [{ name: "Manual tool selection", detail: "Tools selected on ad-hoc basis without formal evaluation" }] },
          { name: "Level 2 - Repeatable", detail: "Consistent tool usage", criteria: [{ name: "Standardized toolset", detail: "Organization has a defined set of process mining tools" }] },
          { name: "Level 3 - Defined", detail: "Managed tool ecosystem", criteria: [{ name: "Tool governance", detail: "Formal tool evaluation and governance process exists" }] },
          { name: "Level 4 - Managed", detail: "Optimized tool stack", criteria: [{ name: "Integrated toolchain", detail: "Tools are fully integrated into the analytics pipeline" }] },
          { name: "Level 5 - Optimizing", detail: "Innovative tooling", criteria: [{ name: "Cutting-edge tools", detail: "Organization actively evaluates and adopts emerging tools" }] },
        ],
      },
      {
        name: "Integration with Data Source",
        detail: "Integration capabilities with source data systems",
        levels: [
          { name: "Level 1 - Initial", detail: "Manual data collection", criteria: [{ name: "Manual extraction", detail: "Data is manually extracted from source systems" }] },
          { name: "Level 2 - Repeatable", detail: "Semi-automated integration", criteria: [{ name: "Scripted extraction", detail: "Data extraction uses repeatable scripts" }] },
          { name: "Level 3 - Defined", detail: "Defined integration pipelines", criteria: [{ name: "ETL pipelines", detail: "Formal ETL pipelines connect to data sources" }] },
          { name: "Level 4 - Managed", detail: "Managed real-time integration", criteria: [{ name: "Real-time connectors", detail: "Real-time data connectors with monitoring" }] },
          { name: "Level 5 - Optimizing", detail: "Self-optimizing integration", criteria: [{ name: "Adaptive integration", detail: "Integration pipelines self-optimize based on data quality metrics" }] },
        ],
      },
      {
        name: "Integration with Operational Applications",
        detail: "Integration with downstream operational systems and applications",
        levels: [
          { name: "Level 1 - Initial", detail: "No integration", criteria: [{ name: "Isolated results", detail: "Mining results are not fed back into operational systems" }] },
          { name: "Level 2 - Repeatable", detail: "Basic feedback", criteria: [{ name: "Manual feedback", detail: "Results are manually communicated to operational teams" }] },
          { name: "Level 3 - Defined", detail: "Structured integration", criteria: [{ name: "API integration", detail: "Results are shared via APIs with operational applications" }] },
          { name: "Level 4 - Managed", detail: "Automated feedback loops", criteria: [{ name: "Automated actions", detail: "Process improvements are automatically triggered" }] },
          { name: "Level 5 - Optimizing", detail: "Closed-loop optimization", criteria: [{ name: "Continuous optimization", detail: "Full closed-loop process optimization with operational systems" }] },
        ],
      },
    ],
  },
  {
    name: "Data",
    detail: "Data dimension covering availability, security, quality, explainability, and privacy",
    subdimensions: [
      {
        name: "Availability",
        detail: "Data availability for process mining activities",
        levels: [
          { name: "Level 1 - Initial", detail: "Limited availability", criteria: [{ name: "Ad-hoc access", detail: "Data access is ad-hoc and limited" }] },
          { name: "Level 2 - Repeatable", detail: "Defined access", criteria: [{ name: "Scheduled access", detail: "Data is available on a scheduled basis" }] },
          { name: "Level 3 - Defined", detail: "Reliable availability", criteria: [{ name: "Data warehouse", detail: "Centralized data warehouse ensures availability" }] },
          { name: "Level 4 - Managed", detail: "High availability", criteria: [{ name: "Real-time access", detail: "Data is available in near real-time" }] },
          { name: "Level 5 - Optimizing", detail: "Optimized availability", criteria: [{ name: "Self-service data", detail: "Self-service data access with quality guarantees" }] },
        ],
      },
      {
        name: "Security",
        detail: "Data security measures for process mining data",
        levels: [
          { name: "Level 1 - Initial", detail: "Basic security", criteria: [{ name: "Basic controls", detail: "Basic access controls exist" }] },
          { name: "Level 2 - Repeatable", detail: "Defined security", criteria: [{ name: "Role-based access", detail: "Role-based access control implemented" }] },
          { name: "Level 3 - Defined", detail: "Managed security", criteria: [{ name: "Encryption", detail: "Data encryption at rest and in transit" }] },
          { name: "Level 4 - Managed", detail: "Advanced security", criteria: [{ name: "Audit trails", detail: "Comprehensive audit trails and monitoring" }] },
          { name: "Level 5 - Optimizing", detail: "Proactive security", criteria: [{ name: "Threat detection", detail: "Proactive threat detection and automated response" }] },
        ],
      },
      {
        name: "Quality",
        detail: "Data quality management for process mining",
        levels: [
          { name: "Level 1 - Initial", detail: "Unknown quality", criteria: [{ name: "No quality checks", detail: "No formal data quality assessment" }] },
          { name: "Level 2 - Repeatable", detail: "Basic quality", criteria: [{ name: "Manual validation", detail: "Manual data validation processes" }] },
          { name: "Level 3 - Defined", detail: "Defined quality", criteria: [{ name: "Quality metrics", detail: "Formal data quality metrics defined" }] },
          { name: "Level 4 - Managed", detail: "Managed quality", criteria: [{ name: "Automated quality", detail: "Automated data quality monitoring" }] },
          { name: "Level 5 - Optimizing", detail: "Optimized quality", criteria: [{ name: "Self-healing data", detail: "Automated data quality remediation" }] },
        ],
      },
      {
        name: "Explainability",
        detail: "Ability to explain and interpret process mining results",
        levels: [
          { name: "Level 1 - Initial", detail: "No explainability", criteria: [{ name: "Raw output", detail: "Results presented as raw data without explanation" }] },
          { name: "Level 2 - Repeatable", detail: "Basic explanations", criteria: [{ name: "Simple reports", detail: "Basic reports with simple explanations" }] },
          { name: "Level 3 - Defined", detail: "Structured explanations", criteria: [{ name: "Visual narratives", detail: "Interactive visualizations with contextual explanations" }] },
          { name: "Level 4 - Managed", detail: "Advanced explainability", criteria: [{ name: "Root cause analysis", detail: "Automated root cause analysis with clear explanations" }] },
          { name: "Level 5 - Optimizing", detail: "Full transparency", criteria: [{ name: "Explainable AI", detail: "Full explainability of AI-driven recommendations" }] },
        ],
      },
      {
        name: "Privacy",
        detail: "Data privacy compliance and management",
        levels: [
          { name: "Level 1 - Initial", detail: "Ad-hoc privacy", criteria: [{ name: "No privacy policy", detail: "No formal privacy considerations" }] },
          { name: "Level 2 - Repeatable", detail: "Basic privacy", criteria: [{ name: "Privacy awareness", detail: "Basic privacy awareness and policies" }] },
          { name: "Level 3 - Defined", detail: "Defined privacy", criteria: [{ name: "Compliance framework", detail: "Privacy compliance framework implemented" }] },
          { name: "Level 4 - Managed", detail: "Managed privacy", criteria: [{ name: "Privacy by design", detail: "Privacy by design principles applied" }] },
          { name: "Level 5 - Optimizing", detail: "Optimized privacy", criteria: [{ name: "Automated compliance", detail: "Automated privacy compliance monitoring and enforcement" }] },
        ],
      },
    ],
  },
  {
    name: "People",
    detail: "People dimension covering skills and responsibilities",
    subdimensions: [
      {
        name: "Skill",
        detail: "Skills and competencies for process mining",
        levels: [
          { name: "Level 1 - Initial", detail: "Limited skills", criteria: [{ name: "Basic awareness", detail: "Limited awareness of process mining concepts" }] },
          { name: "Level 2 - Repeatable", detail: "Developing skills", criteria: [{ name: "Training programs", detail: "Basic training programs available" }] },
          { name: "Level 3 - Defined", detail: "Defined competencies", criteria: [{ name: "Skill framework", detail: "Formal skill framework and certification paths" }] },
          { name: "Level 4 - Managed", detail: "Advanced skills", criteria: [{ name: "Expert teams", detail: "Dedicated expert teams with advanced skills" }] },
          { name: "Level 5 - Optimizing", detail: "Continuous learning", criteria: [{ name: "Innovation culture", detail: "Continuous learning and knowledge sharing culture" }] },
        ],
      },
      {
        name: "Responsibility",
        detail: "Roles and responsibilities for process mining activities",
        levels: [
          { name: "Level 1 - Initial", detail: "Unclear roles", criteria: [{ name: "Ad-hoc roles", detail: "No formal roles defined for process mining" }] },
          { name: "Level 2 - Repeatable", detail: "Basic roles", criteria: [{ name: "Assigned roles", detail: "Basic roles assigned to individuals" }] },
          { name: "Level 3 - Defined", detail: "Defined structure", criteria: [{ name: "RACI matrix", detail: "Clear RACI matrix for process mining activities" }] },
          { name: "Level 4 - Managed", detail: "Managed teams", criteria: [{ name: "Dedicated CoE", detail: "Center of Excellence with clear responsibilities" }] },
          { name: "Level 5 - Optimizing", detail: "Evolved structure", criteria: [{ name: "Distributed ownership", detail: "Distributed process ownership across the organization" }] },
        ],
      },
    ],
  },
  {
    name: "Culture",
    detail: "Culture dimension covering use case availability, management involvement, adaptability, and consistency",
    subdimensions: [
      {
        name: "Use Case Availability",
        detail: "Availability and diversity of process mining use cases",
        levels: [
          { name: "Level 1 - Initial", detail: "Pilot use cases", criteria: [{ name: "Single pilot", detail: "One or two pilot use cases" }] },
          { name: "Level 2 - Repeatable", detail: "Multiple use cases", criteria: [{ name: "Department-level", detail: "Use cases across a few departments" }] },
          { name: "Level 3 - Defined", detail: "Portfolio of use cases", criteria: [{ name: "Use case catalog", detail: "Formal catalog of use cases maintained" }] },
          { name: "Level 4 - Managed", detail: "Strategic use cases", criteria: [{ name: "Strategic alignment", detail: "Use cases aligned with strategic objectives" }] },
          { name: "Level 5 - Optimizing", detail: "Innovation-driven", criteria: [{ name: "Continuous discovery", detail: "Continuous discovery and prioritization of new use cases" }] },
        ],
      },
      {
        name: "Management Involvement",
        detail: "Level of management support and involvement in process mining",
        levels: [
          { name: "Level 1 - Initial", detail: "Low awareness", criteria: [{ name: "Limited sponsorship", detail: "Management has limited awareness of PM" }] },
          { name: "Level 2 - Repeatable", detail: "Basic support", criteria: [{ name: "Project sponsorship", detail: "Management sponsors individual projects" }] },
          { name: "Level 3 - Defined", detail: "Active involvement", criteria: [{ name: "Regular reviews", detail: "Management regularly reviews PM outcomes" }] },
          { name: "Level 4 - Managed", detail: "Strategic leadership", criteria: [{ name: "Executive champion", detail: "Executive champion drives PM strategy" }] },
          { name: "Level 5 - Optimizing", detail: "Embedded leadership", criteria: [{ name: "PM-driven culture", detail: "PM insights embedded in executive decision-making" }] },
        ],
      },
      {
        name: "Adaptability",
        detail: "Organization ability to adapt processes based on mining insights",
        levels: [
          { name: "Level 1 - Initial", detail: "Resistant to change", criteria: [{ name: "Low adaptability", detail: "Organization resistant to process changes" }] },
          { name: "Level 2 - Repeatable", detail: "Selective adaptation", criteria: [{ name: "Pilot changes", detail: "Some processes adapted based on insights" }] },
          { name: "Level 3 - Defined", detail: "Structured adaptation", criteria: [{ name: "Change management", detail: "Formal change management process for PM insights" }] },
          { name: "Level 4 - Managed", detail: "Proactive adaptation", criteria: [{ name: "Proactive changes", detail: "Organization proactively adapts based on insights" }] },
          { name: "Level 5 - Optimizing", detail: "Agile adaptation", criteria: [{ name: "Continuous adaptation", detail: "Agile, continuous process adaptation culture" }] },
        ],
      },
      {
        name: "Consistency",
        detail: "Consistency of process mining practices across the organization",
        levels: [
          { name: "Level 1 - Initial", detail: "Inconsistent", criteria: [{ name: "Fragmented practices", detail: "PM practices vary widely across teams" }] },
          { name: "Level 2 - Repeatable", detail: "Emerging consistency", criteria: [{ name: "Shared guidelines", detail: "Some shared guidelines exist" }] },
          { name: "Level 3 - Defined", detail: "Standardized", criteria: [{ name: "Standard procedures", detail: "Standardized procedures across departments" }] },
          { name: "Level 4 - Managed", detail: "Measured consistency", criteria: [{ name: "Compliance monitoring", detail: "Compliance with standards is measured" }] },
          { name: "Level 5 - Optimizing", detail: "Self-reinforcing", criteria: [{ name: "Embedded practices", detail: "PM practices embedded in organizational DNA" }] },
        ],
      },
    ],
  },
  {
    name: "Governance",
    detail: "Governance dimension covering communication, quality metrics, documentation, and ownership",
    subdimensions: [
      {
        name: "Communication",
        detail: "Communication of process mining results and insights",
        levels: [
          { name: "Level 1 - Initial", detail: "Ad-hoc communication", criteria: [{ name: "Informal sharing", detail: "Results shared informally" }] },
          { name: "Level 2 - Repeatable", detail: "Structured reporting", criteria: [{ name: "Regular reports", detail: "Regular reporting to stakeholders" }] },
          { name: "Level 3 - Defined", detail: "Multi-channel communication", criteria: [{ name: "Communication plan", detail: "Formal communication plan exists" }] },
          { name: "Level 4 - Managed", detail: "Integrated communication", criteria: [{ name: "Dashboards", detail: "Interactive dashboards for all stakeholders" }] },
          { name: "Level 5 - Optimizing", detail: "Proactive communication", criteria: [{ name: "Automated alerts", detail: "Proactive automated insights and alerts" }] },
        ],
      },
      {
        name: "Quality Metric",
        detail: "Metrics for measuring process mining quality and impact",
        levels: [
          { name: "Level 1 - Initial", detail: "No metrics", criteria: [{ name: "No KPIs", detail: "No formal metrics for PM quality" }] },
          { name: "Level 2 - Repeatable", detail: "Basic metrics", criteria: [{ name: "Basic KPIs", detail: "Basic KPIs defined for PM projects" }] },
          { name: "Level 3 - Defined", detail: "Comprehensive metrics", criteria: [{ name: "Metric framework", detail: "Comprehensive metric framework" }] },
          { name: "Level 4 - Managed", detail: "Measured and managed", criteria: [{ name: "Performance tracking", detail: "Regular performance tracking and benchmarking" }] },
          { name: "Level 5 - Optimizing", detail: "Predictive metrics", criteria: [{ name: "Predictive KPIs", detail: "Predictive and leading indicators used" }] },
        ],
      },
      {
        name: "Documentation System",
        detail: "Documentation practices for process mining",
        levels: [
          { name: "Level 1 - Initial", detail: "No documentation", criteria: [{ name: "Undocumented", detail: "Processes and results not documented" }] },
          { name: "Level 2 - Repeatable", detail: "Basic documentation", criteria: [{ name: "Project docs", detail: "Individual project documentation" }] },
          { name: "Level 3 - Defined", detail: "Standardized documentation", criteria: [{ name: "Templates", detail: "Standardized documentation templates" }] },
          { name: "Level 4 - Managed", detail: "Knowledge management", criteria: [{ name: "Knowledge base", detail: "Centralized knowledge management system" }] },
          { name: "Level 5 - Optimizing", detail: "Living documentation", criteria: [{ name: "Auto-generated docs", detail: "Auto-generated and continuously updated documentation" }] },
        ],
      },
      {
        name: "Ownership",
        detail: "Process and data ownership for process mining",
        levels: [
          { name: "Level 1 - Initial", detail: "No ownership", criteria: [{ name: "Unclear ownership", detail: "No clear process or data ownership" }] },
          { name: "Level 2 - Repeatable", detail: "Assigned owners", criteria: [{ name: "Process owners", detail: "Process owners assigned for key processes" }] },
          { name: "Level 3 - Defined", detail: "Formal ownership", criteria: [{ name: "Ownership framework", detail: "Formal ownership framework with accountability" }] },
          { name: "Level 4 - Managed", detail: "Empowered owners", criteria: [{ name: "Empowered ownership", detail: "Owners empowered with tools and authority" }] },
          { name: "Level 5 - Optimizing", detail: "Distributed ownership", criteria: [{ name: "Collective ownership", detail: "Collective ownership with shared accountability" }] },
        ],
      },
    ],
  },
  {
    name: "Strategic Alignment",
    detail: "Strategic alignment covering strategy, budgeting, and business contribution",
    subdimensions: [
      {
        name: "Strategy",
        detail: "Alignment of process mining with organizational strategy",
        levels: [
          { name: "Level 1 - Initial", detail: "No alignment", criteria: [{ name: "Disconnected", detail: "PM activities not linked to strategy" }] },
          { name: "Level 2 - Repeatable", detail: "Partial alignment", criteria: [{ name: "Occasional alignment", detail: "Some PM projects linked to strategic goals" }] },
          { name: "Level 3 - Defined", detail: "Defined alignment", criteria: [{ name: "Strategic roadmap", detail: "PM roadmap aligned with business strategy" }] },
          { name: "Level 4 - Managed", detail: "Measured alignment", criteria: [{ name: "Strategic metrics", detail: "PM contribution to strategy is measured" }] },
          { name: "Level 5 - Optimizing", detail: "Strategic driver", criteria: [{ name: "Strategy enabler", detail: "PM is a key strategic driver and differentiator" }] },
        ],
      },
      {
        name: "Budgeting",
        detail: "Budget allocation and financial management for process mining",
        levels: [
          { name: "Level 1 - Initial", detail: "No budget", criteria: [{ name: "Ad-hoc funding", detail: "No dedicated budget for PM" }] },
          { name: "Level 2 - Repeatable", detail: "Project budget", criteria: [{ name: "Project funding", detail: "Budget allocated per project" }] },
          { name: "Level 3 - Defined", detail: "Annual budget", criteria: [{ name: "Annual allocation", detail: "Dedicated annual PM budget" }] },
          { name: "Level 4 - Managed", detail: "ROI-driven budget", criteria: [{ name: "ROI tracking", detail: "Budget tied to ROI measurements" }] },
          { name: "Level 5 - Optimizing", detail: "Strategic investment", criteria: [{ name: "Investment portfolio", detail: "PM budget as strategic investment portfolio" }] },
        ],
      },
      {
        name: "Business Contribution",
        detail: "Business value and impact of process mining initiatives",
        levels: [
          { name: "Level 1 - Initial", detail: "Unknown contribution", criteria: [{ name: "No measurement", detail: "Business impact not measured" }] },
          { name: "Level 2 - Repeatable", detail: "Anecdotal impact", criteria: [{ name: "Case studies", detail: "Individual success stories documented" }] },
          { name: "Level 3 - Defined", detail: "Measured contribution", criteria: [{ name: "Value framework", detail: "Formal value measurement framework" }] },
          { name: "Level 4 - Managed", detail: "Significant contribution", criteria: [{ name: "Business KPIs", detail: "PM directly impacts business KPIs" }] },
          { name: "Level 5 - Optimizing", detail: "Transformational impact", criteria: [{ name: "Business transformation", detail: "PM drives business transformation and competitive advantage" }] },
        ],
      },
    ],
  },
];

export default dimensionSeedData;
