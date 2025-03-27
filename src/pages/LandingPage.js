// src/pages/LandingPage.js
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const appDemoRef = useRef(null);
  const navigate = useNavigate();

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Small Animal Veterinarian",
      clinic: "Pawsitive Care Animal Hospital",
      quote: "ClinicalPaws has revolutionized how I practice medicine. I can access research-backed information in seconds during consultations.",
      image: "sarah-johnson.jpg"
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      role: "Emergency Veterinarian",
      clinic: "Bay Area Emergency Vet Center",
      quote: "In emergency medicine, every second counts. ClinicalPaws helps me make critical decisions faster with evidence-based support.",
      image: "michael-chen.jpg"
    },
    {
      id: 3,
      name: "Dr. Lisa Rodriguez",
      role: "Veterinary Practice Owner",
      clinic: "Sunset Veterinary Clinic",
      quote: "Our entire staff relies on ClinicalPaws daily. The voice activation feature is perfect during procedures when our hands are occupied.",
      image: "lisa-rodriguez.jpg"
    },
    {
      id: 4,
      name: "Dr. James Wilson",
      role: "Equine Specialist",
      clinic: "Gallop Equine Veterinary Services",
      quote: "Even in field settings, ClinicalPaws gives me access to specialized equine research that helps me provide better care for my patients.",
      image: "james-wilson.jpg"
    }
  ];

  // FAQ data
  const faqItems = [
    {
      id: 1,
      question: "How does ClinicalPaws work during a patient examination?",
      answer: "During an examination, you can activate ClinicalPaws with a voice command. Simply speak your observations, symptoms, or questions, and our AI will process this information in real-time. The system will provide relevant research, potential diagnoses, treatment recommendations, and other clinical insights based on the latest veterinary literature. All information is displayed on your device or can be read back to you through voice output."
    },
    {
      id: 2,
      question: "Is my practice data secure with ClinicalPaws?",
      answer: "Absolutely. We take data security extremely seriously. ClinicalPaws is fully HIPAA compliant in the US and GDPR compliant in Europe. All data is encrypted both in transit and at rest using industry-leading encryption standards. We implement role-based access controls, regular security audits, and follow best practices for veterinary data protection. Your practice and patient data is never sold or shared with third parties."
    },
    {
      id: 3,
      question: "Can I integrate ClinicalPaws with my existing practice management software?",
      answer: "Yes, ClinicalPaws is designed to integrate with most popular veterinary practice management systems. We currently support direct integrations with VetLogic, eVetPractice, Cornerstone, and several other major platforms. For other systems, we offer API access and CSV import/export functionality. Our technical team can assist with custom integrations for enterprise clients."
    },
    {
      id: 4,
      question: "What devices can I use ClinicalPaws on?",
      answer: "ClinicalPaws works on most modern devices. We have native applications for iOS and Android mobile devices, as well as desktop applications for Windows and Mac. You can also access ClinicalPaws through any modern web browser. The voice recognition features work best with devices that have built-in microphones or connected headsets."
    },
    {
      id: 5,
      question: "How often is the clinical database updated?",
      answer: "Our veterinary knowledge base is continuously updated. New peer-reviewed research is incorporated weekly, and our clinical guidelines are reviewed and updated monthly by our veterinary advisory board. Critical updates, such as medication recalls or urgent treatment advisories, are pushed to the system immediately upon verification."
    },
    {
      id: 6,
      question: "What happens after my free trial ends?",
      answer: "After your 14-day free trial, you'll be notified that the trial period is ending. You can then choose to subscribe to one of our plans to continue using ClinicalPaws. If you decide not to subscribe, your account will be downgraded to a limited free version with basic features. Don't worry - we'll keep your data secure for 60 days in case you decide to upgrade later."
    }
  ];

  // Add touch swipe functionality for testimonials
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left, go to next testimonial
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }
    
    if (touchEnd - touchStart > 50) {
      // Swipe right, go to previous testimonial
      setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length);
    }
  };

  useEffect(() => {
    // Check for accessToken cookie
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));

    if (accessTokenCookie) {
      // If accessToken exists, navigate to audio recorder page
      navigate('/AudioRecorderPage');
    }

    // Check if screen width is mobile-sized
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Set up testimonial slider
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);

    // Set up scroll animation observers
    const observerOptions = {
      threshold: 0.3
    };

    // Observe all animate elements
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => scrollObserver.observe(el));

    // Close mobile menu when clicking outside
    if (mobileMenuOpen) {
      document.addEventListener('click', closeMobileMenuOnOutsideClick);
    }

    // Optimize animations for mobile
    if (isMobile) {
      // Reduce animation complexity on mobile
      const animationElements = document.querySelectorAll('.animate-on-scroll');
      animationElements.forEach(el => {
        el.style.transitionDuration = '0.5s'; // Faster animations on mobile
      });
    }
  }, [navigate, testimonials.length, mobileMenuOpen, isMobile]);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setMobileMenuOpen(false); // Close mobile menu after clicking
    }
  };

  const handleDemoRequest = (e) => {
    e.preventDefault();
    // Handle the demo request form submission
    console.log("Demo requested");
    // Show success message
    alert("Thank you for your interest! Our team will contact you shortly to schedule your demo.");
  };

  const toggleFaq = (id) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenuOnOutsideClick = (e) => {
    if (mobileMenuOpen && !e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-toggle')) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Add this backdrop div for mobile menu */}
      {mobileMenuOpen && (
        <div className="backdrop show" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Header Navigation */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <h1>ClinicalPaws<span className="paw-icon">🐾</span></h1>
          </div>
          
          {/* Mobile Menu Toggle Button */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`} 
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <nav className={`nav-menu ${isMobile ? 'mobile' : ''} ${mobileMenuOpen ? 'open' : ''}`}>
            <ul>
              <li className={activeSection === "home" ? "active" : ""}>
                <a href="#home" onClick={() => scrollToSection("home")}>Home</a>
              </li>
              <li className={activeSection === "features" ? "active" : ""}>
                <a href="#features" onClick={() => scrollToSection("features")}>Features</a>
              </li>
              <li className={activeSection === "how-it-works" ? "active" : ""}>
                <a href="#how-it-works" onClick={() => scrollToSection("how-it-works")}>How It Works</a>
              </li>
              <li className={activeSection === "testimonials" ? "active" : ""}>
                <a href="#testimonials" onClick={() => scrollToSection("testimonials")}>Testimonials</a>
              </li>
              <li className={activeSection === "free-trial" ? "active" : ""}>
                <a href="#free-trial" onClick={() => scrollToSection("free-trial")}>Free Trial</a>
              </li>
              <li className={activeSection === "faq" ? "active" : ""}>
                <a href="#faq" onClick={() => scrollToSection("faq")}>FAQ</a>
              </li>
              <li className={activeSection === "contact" ? "active" : ""}>
                <a href="#contact" onClick={() => scrollToSection("contact")}>Contact</a>
              </li>
            </ul>
          </nav>
          
          <div className={`auth-buttons ${isMobile ? 'mobile' : ''} ${mobileMenuOpen ? 'show' : ''}`}>
            <Link to="/login" className="btn login-btn">Sign In</Link>
            <Link to="/signup" className="btn signup-btn">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <h2>AI-Powered Clinical Assistant for Veterinarians</h2>
          <p>Your intelligent companion for evidence-based veterinary medicine</p>
          <div className="hero-buttons">
            <button 
              onClick={() => scrollToSection("demo")} 
              className="btn primary-btn demo-hero-btn"
            >
              <span className="btn-icon">🏥</span> Request a Demo for Your Clinic
            </button>
            <Link to="/signup" className="btn secondary-btn">
              Start Free Trial
            </Link>
          </div>
        </div>
        <div className="hero-feature-display">
          <div className="app-mockup">
            <div className="app-mockup-header">
              <div className="app-mockup-title">ClinicalPaws</div>
              <div className="app-mockup-status">Recording...</div>
            </div>
            <div className="transcription-container">
              <p className="transcription-title">Live Assessment</p>
              <div className="conversation-flow">
                <div className="vet-input">
                  <span className="icon">🩺</span>
                  <p>"5-year-old Labrador with acute vomiting and lethargy..."</p>
                </div>
                <div className="ai-response">
                  <span className="icon">🤖</span>
                  <div className="diagnosis-suggestion">
                    <p className="suggestion-header">Diagnostic Considerations:</p>
                    <ul className="suggestion-items">
                      <li>Foreign body ingestion</li>
                      <li>Acute gastroenteritis</li>
                      <li>Pancreatitis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-badges">
              <div className="feature-badge">
                <span className="badge-icon">⚡</span>
                <span>Real-time Analysis</span>
              </div>
              <div className="feature-badge">
                <span className="badge-icon">📊</span>
                <span>Evidence-Based</span>
              </div>
              <div className="feature-badge">
                <span className="badge-icon">🔊</span>
                <span>Voice Activated</span>
              </div>
            </div>
          </div>
          <div className="floating-element ai-bubble">
            <div className="ai-icon">🤖</div>
            <div className="ai-text">Evidence-based recommendations</div>
          </div>
          <div className="floating-element stats-bubble">
            <div className="stats-text">Save 4+ hours per week</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <h2>Powerful Features for Veterinary Professionals</h2>
          <div className="features-grid">
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">🔬</div>
              <h3>Real-time Diagnostic Assistance</h3>
              <p>Get instant AI-powered diagnostic support during patient examinations</p>
            </div>
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">📚</div>
              <h3>Evidence-Based Medicine</h3>
              <p>Access the latest veterinary research and clinical guidelines</p>
            </div>
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">🎙️</div>
              <h3>Voice-Activated Support</h3>
              <p>Hands-free operation during examinations and procedures</p>
            </div>
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">⏱️</div>
              <h3>Time Efficiency</h3>
              <p>Reduce research time from hours to seconds with AI assistance</p>
            </div>
          </div>
          <div className="features-cta">
            <button 
              onClick={() => scrollToSection("demo")} 
              className="btn primary-btn"
            >
              Request a Demo for Your Clinic
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-to-section">
        <div className="section-container">
          <h2>How ClinicalPaws Works</h2>
          <div className="tutorial-container">
            <div className="video-tutorial animate-on-scroll">
              {/* Embedded video tutorial placeholder */}
              <div className="video-placeholder">
                <span>Video Tutorial: Getting Started with ClinicalPaws</span>
                <button className="play-button">▶</button>
              </div>
            </div>
            <div className="step-by-step">
              <div className="step animate-on-scroll">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Create your account</h3>
                  <p>Sign up for a free trial - no credit card required</p>
                </div>
              </div>
              <div className="step animate-on-scroll">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Start a recording session</h3>
                  <p>Use the voice recorder during patient examinations</p>
                </div>
              </div>
              <div className="step animate-on-scroll">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Review AI suggestions</h3>
                  <p>Get evidence-based insights and clinical recommendations</p>
                </div>
              </div>
              <div className="step animate-on-scroll">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Save and access later</h3>
                  <p>All sessions are securely stored for future reference</p>
                </div>
              </div>
            </div>
          </div>
          <div className="how-it-works-cta">
            <button 
              onClick={() => scrollToSection("free-trial")} 
              className="btn secondary-btn"
            >
              Try It Yourself - Free 14-Day Trial
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <h2 className="testimonials-heading">Trusted by Veterinary Professionals</h2>
          
          <div 
            className="testimonials-slider"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="testimonials-track" style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}>
              {testimonials.map(testimonial => (
                <div className="testimonial-card" key={testimonial.id}>
                  <div className="testimonial-content">
                    <div className="quote-mark">"</div>
                    <p className="testimonial-quote">{testimonial.quote}</p>
                    <div className="testimonial-author">
                      <div className="author-image">
                        {/* We'll use a placeholder for now */}
                        <div className="author-image-placeholder">{testimonial.name.charAt(0)}</div>
                      </div>
                      <div className="author-info">
                        <h3>{testimonial.name}</h3>
                        <p>{testimonial.role}</p>
                        <p className="clinic-name">{testimonial.clinic}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="testimonial-indicators">
            {testimonials.map((_, index) => (
              <button 
                key={index} 
                className={`indicator ${currentTestimonial === index ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(index)}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory Compliance Section */}
      <section id="compliance" className="compliance-section">
        <div className="section-container">
          <h2>Regulatory Compliance & Data Security</h2>
          <p className="section-subtitle">We prioritize the security and privacy of your veterinary practice data</p>
          
          <div className="compliance-icons">
            <div className="compliance-icon animate-on-scroll">
              <div className="icon-container hipaa">
                <span className="icon-text">HIPAA</span>
              </div>
              <h3>HIPAA Compliant</h3>
              <p>Fully compliant with US healthcare data privacy standards</p>
            </div>
            
            <div className="compliance-icon animate-on-scroll">
              <div className="icon-container gdpr">
                <span className="icon-text">GDPR</span>
              </div>
              <h3>GDPR Compliant</h3>
              <p>Meets European data protection regulations</p>
            </div>
            
            <div className="compliance-icon animate-on-scroll">
              <div className="icon-container encryption">
                <span className="icon-text">256-bit</span>
              </div>
              <h3>Advanced Encryption</h3>
              <p>Enterprise-grade encryption for all data</p>
            </div>
            
            <div className="compliance-icon animate-on-scroll">
              <div className="icon-container audit">
                <span className="icon-text">SOC 2</span>
              </div>
              <h3>SOC 2 Certified</h3>
              <p>Independently audited security controls</p>
            </div>
          </div>
          
          <div className="compliance-details">
            <p>At ClinicalPaws, we understand that veterinary practices handle sensitive patient information. Our platform is designed from the ground up to comply with regional data protection regulations wherever your practice operates.</p>
            
            <div className="compliance-features">
              <div className="compliance-feature">
                <h4>United States</h4>
                <p>Our service is fully HIPAA compliant, ensuring that all Protected Health Information (PHI) is handled according to required standards.</p>
              </div>
              
              <div className="compliance-feature">
                <h4>European Union</h4>
                <p>We adhere to all GDPR requirements, including data minimization, purpose limitation, and providing data subject rights.</p>
              </div>
              
              <div className="compliance-feature">
                <h4>International Operations</h4>
                <p>Our global compliance team ensures that our service meets regional requirements in Canada, Australia, and other international markets.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Trial Section */}
      <section id="free-trial" className="free-trial-section">
        <div className="section-container">
          <h2>Start Your Free Trial Today</h2>
          <p>Experience ClinicalPaws for 14 days, no credit card required</p>
          
          <div className="trial-features">
            <div className="trial-feature">
              <div className="check-icon">✓</div>
              <p>Full access to all premium features</p>
            </div>
            <div className="trial-feature">
              <div className="check-icon">✓</div>
              <p>Unlimited AI-assisted sessions</p>
            </div>
            <div className="trial-feature">
              <div className="check-icon">✓</div>
              <p>Complete clinical database access</p>
            </div>
            <div className="trial-feature">
              <div className="check-icon">✓</div>
              <p>Email support from our veterinary experts</p>
            </div>
          </div>
          
          <div className="trial-options">
            <div className="trial-card animate-on-scroll">
              <h3>Individual Veterinarian</h3>
              <p className="trial-price">
                <span className="price-amount">Free for 14 days</span>
                <span className="price-period">then $99/month</span>
              </p>
              <Link to="/signup" className="btn primary-btn">Start Free Trial</Link>
            </div>
            
            <div className="trial-card featured animate-on-scroll">
              <div className="recommended-tag">Recommended for Clinics</div>
              <h3>Multi-Vet Practice</h3>
              <p className="trial-price">
                <span className="price-amount">Free for 14 days</span>
                <span className="price-period">then $249/month</span>
              </p>
              <p className="trial-desc">For practices with up to 5 veterinarians</p>
              <button 
                className="btn primary-btn"
                onClick={() => scrollToSection("demo")}
              >
                Book Clinic Demo
              </button>
            </div>
            
            <div className="trial-card animate-on-scroll">
              <h3>Enterprise</h3>
              <p className="trial-price">
                <span className="price-amount">Custom Solution</span>
                <span className="price-period">Contact us for pricing</span>
              </p>
              <button 
                className="btn secondary-btn"
                onClick={() => scrollToSection("demo")}
              >
                Contact Sales
              </button>
        </div>
      </div>

          <p className="no-obligation">No obligation to continue after trial. No credit card required to start.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-container">
            {faqItems.map(item => (
              <div 
                key={item.id} 
                className={`faq-item ${expandedFaq === item.id ? 'expanded' : ''}`}
                onClick={() => toggleFaq(item.id)}
              >
                <div className="faq-question">
                  <h3>{item.question}</h3>
                  <div className="faq-toggle">
                    {expandedFaq === item.id ? '−' : '+'}
                  </div>
                </div>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="faq-cta">
            <p>Still have questions?</p>
            <button 
              onClick={() => scrollToSection("contact")} 
              className="btn secondary-btn"
            >
              Contact Our Support Team
            </button>
          </div>
        </div>
      </section>

      {/* Demo Request Section */}
      <section id="demo" className="demo-section">
        <div className="section-container">
          <h2>Request a Demo for Your Clinic</h2>
          <p>See how ClinicalPaws can transform your veterinary practice</p>
          <form className="demo-form" onSubmit={handleDemoRequest}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" placeholder="Dr. Jane Smith" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="jane@vetclinic.com" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="practice">Practice/Clinic Name</label>
                <input type="text" id="practice" placeholder="Smith Veterinary Clinic" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" placeholder="+1 (555) 123-4567" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="size">Clinic Size</label>
                <select id="size" required>
                  <option value="">Select clinic size</option>
                  <option value="solo">Solo Practitioner</option>
                  <option value="small">Small (2-5 veterinarians)</option>
                  <option value="medium">Medium (6-15 veterinarians)</option>
                  <option value="large">Large (16+ veterinarians)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="specialty">Primary Specialty (if any)</label>
                <select id="specialty">
                  <option value="">General Practice</option>
                  <option value="emergency">Emergency & Critical Care</option>
                  <option value="surgery">Surgery</option>
                  <option value="dermatology">Dermatology</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="oncology">Oncology</option>
                  <option value="other">Other Specialty</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="message">What are you most interested in learning about?</label>
              <textarea id="message" rows="3" placeholder="Tell us about your practice needs and interests..."></textarea>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="updates" />
              <label htmlFor="updates">I'd like to receive updates about new features and veterinary AI developments</label>
            </div>
            <button type="submit" className="btn submit-btn">Schedule My Clinic Demo</button>
          </form>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <h2>Contact Us</h2>
          <div className="contact-methods">
            <div className="contact-card animate-on-scroll">
              <div className="contact-icon">📧</div>
              <h3>Email Us</h3>
              <p>support@clinicalpaws.com</p>
              <p>For technical support and general inquiries</p>
            </div>
            <div className="contact-card animate-on-scroll">
              <div className="contact-icon">📞</div>
              <h3>Call Us</h3>
              <p>+1 (555) 987-6543</p>
              <p>Available Monday-Friday, 9am-5pm EST</p>
            </div>
            <div className="contact-card animate-on-scroll">
              <div className="contact-icon">💬</div>
              <h3>Live Chat</h3>
              <p>Available on our platform</p>
              <p>Get instant assistance from our support team</p>
            </div>
          </div>
          <div className="contact-form-container">
            <h3>Send Us a Message</h3>
            <form className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact-name">Name</label>
                  <input type="text" id="contact-name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input type="email" id="contact-email" required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="contact-subject">Subject</label>
                <input type="text" id="contact-subject" required />
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" rows="4" required></textarea>
              </div>
              <button type="submit" className="btn submit-btn">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <h3>ClinicalPaws<span className="paw-icon">🐾</span></h3>
            <button 
              onClick={() => scrollToSection("demo")} 
              className="btn primary-btn footer-cta"
            >
              Request a Demo for Your Clinic
            </button>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <ul>
                <li><a href="#features" onClick={() => scrollToSection("features")}>Features</a></li>
                <li><a href="#how-it-works" onClick={() => scrollToSection("how-it-works")}>How It Works</a></li>
                <li><a href="#free-trial" onClick={() => scrollToSection("free-trial")}>Free Trial</a></li>
                <li><a href="#compliance" onClick={() => scrollToSection("compliance")}>Security & Compliance</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Company</h4>
              <ul>
                <li><a href="#about" onClick={() => scrollToSection("about")}>About Us</a></li>
                <li><a href="#testimonials" onClick={() => scrollToSection("testimonials")}>Testimonials</a></li>
                <li><a href="#contact" onClick={() => scrollToSection("contact")}>Contact</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Resources</h4>
              <ul>
                <li><a href="#faq" onClick={() => scrollToSection("faq")}>FAQ</a></li>
                <li><a href="#tutorials">Tutorials</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#webinars">Webinars</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#compliance" onClick={() => scrollToSection("compliance")}>Compliance</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="copyright">
          <p>© {new Date().getFullYear()} ClinicalPaws. All rights reserved.</p>
      </div>
      </footer>
    </div>
  );
}

export default LandingPage;
