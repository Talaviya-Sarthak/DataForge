import Header from "@/components/layouts/Header";
import FAQ from "@/components/ui/faq-tabs"

const FAQDemo = () => {
 const categories = {
  all: "All",
  general: "General",
  technical: "Technical",
  support: "Support",
  pricing: "Pricing",
};


 const faqData = {
  all: [
    {
      question: "What is DataForge?",
      answer:
        "DataForge is an AI-powered data platform that helps you upload, clean, enhance, and train machine learning models on your datasets without manual effort.",
    },
    {
      question: "What file formats does DataForge support?",
      answer:
        "Currently, DataForge supports CSV files. Support for additional formats like Excel and Parquet is planned.",
    },
    {
      question: "Is my data secure on DataForge?",
      answer:
        "Yes. All uploaded data is securely processed and handled with strict access controls and encryption best practices.",
    },
    {
      question: "Can I download trained models?",
      answer:
        "Yes. DataForge allows you to download trained models so you can use them directly in your production environment.",
    },
    {
      question: "Do I need machine learning knowledge to use DataForge?",
      answer:
        "No. DataForge is designed to be intuitive for both technical and non-technical users, with AI-driven recommendations throughout the workflow.",
    },
  ],

  general: [
    {
      question: "How does DataForge simplify data analytics?",
      answer:
        "DataForge automates repetitive data tasks such as cleaning, feature creation, and model selection, allowing teams to focus on insights instead of manual work.",
    },
    {
      question: "Who is DataForge built for?",
      answer:
        "DataForge is built for data analysts, data scientists, engineers, startups, and teams that work with structured datasets.",
    },
    {
      question: "Can I explore my dataset before training models?",
      answer:
        "Yes. Once uploaded, DataForge provides a clean, interactive view of your dataset so you can inspect and understand it before proceeding.",
    },
  ],

  technical: [
    {
      question: "What kind of models does DataForge train?",
      answer:
        "DataForge trains multiple machine learning models such as regression models, tree-based models, and gradient boosting models including XGBoost.",
    },
    {
      question: "How does the model leaderboard work?",
      answer:
        "The leaderboard compares trained models based on performance metrics and automatically highlights the best-performing model for your dataset.",
    },
    {
      question: "Does DataForge perform feature engineering?",
      answer:
        "Yes. DataForge automatically suggests and creates features such as age from date of birth, derived metrics, and other useful transformations.",
    },
    {
      question: "Can I retrain models after updating data?",
      answer:
        "Yes. You can clean, modify, or enhance your dataset and retrain models as many times as needed.",
    },
  ],

  support: [
    {
      question: "How can I get help if something goes wrong?",
      answer:
        "You can reach out to our support team through the Help section or contact us directly via email for assistance.",
    },
    {
      question: "Do you provide onboarding or documentation?",
      answer:
        "Yes. DataForge provides clear documentation and guides to help you get started quickly.",
    },
    {
      question: "What if my dataset fails to process?",
      answer:
        "If a dataset fails to process, DataForge provides error feedback and suggestions to help you resolve formatting or data issues.",
    },
  ],

  pricing: [
    {
      question: "Is DataForge free to use?",
      answer:
        "DataForge offers a free tier with limited usage. Paid plans unlock advanced features, higher limits, and priority support.",
    },
    {
      question: "How is pricing calculated?",
      answer:
        "Pricing is based on dataset size, feature usage, and model training frequency. Detailed pricing information is available on the Pricing page.",
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer:
        "Yes. You can change your plan at any time based on your needs.",
    },
    {
      question: "Do you offer enterprise plans?",
      answer:
        "Yes. Enterprise plans are available with custom limits, security features, and dedicated support.",
    },
  ],
};


  return (
    <div className="min-h-screen ">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[320px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#33E6FF]/20 to-blue-500/5 blur-3xl z-10" />
      </div>
      <Header/>
      <FAQ 
        title="Frequently Asked Questions"
        subtitle="Let's answer some questions"
        categories={categories}
        faqData={faqData}
      />
    </div>
  );
};

export default FAQDemo;
