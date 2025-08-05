
import React from 'react';

const AboutPage = () => {
  const colors = {
    primary: '#CBACF9',
    primaryDark: '#9F7AEA',
    background: '#F7F4FF',
    text: {
      primary: '#1F2937',
      
      light: '#6B7280'
    }
  };

  return (
    <div className="min-h-screen max-w-9xl " id="about">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Main Header Section */}
        <div className="text-center mb-16">
          <h1
            className="md:text-5xl text-3xl font-bold mb-6 md:px-4 leading-tight"
            style={{ color: colors.primaryDark }}
          >
            Master Your Interview Skills with AI
          </h1>
         
          <p
            className="md:text-xl text-sm leading-relaxed text-blue-200 max-w-3xl mx-auto"
            
          >
            Our AI-powered interview platform revolutionizes how professionals prepare for career opportunities,
            providing personalized practice sessions and intelligent feedback to boost your confidence and success rate.
          </p>
        </div>

        {/* Platform Purpose Section */}
        <div className="mb-16">
          <h2
            className="md:text-3xl text-xl font-semibold mb-8 text-center text-cyan-400"
           
          >
            What We Do
          </h2>
          <div
            className="p-8 rounded-2xl bg-gray-800 border   text-sm border-gray-400 bg-transparent"
           
          >
            <p
              className=" leading-relaxed mb-6 "
             
            >
              We've created an intelligent interview preparation ecosystem that simulates real-world interview scenarios
              using advanced artificial intelligence. Our platform understands your industry, role requirements, and
              personal strengths to deliver tailored practice experiences that mirror actual interview conditions.
            </p>
            <p
              className=" leading-relaxed"
             
            >
              Whether you're a recent graduate entering the job market, a professional seeking career advancement,
              or someone returning to work after a break, our AI interview coach adapts to your unique needs and
              helps you present your best self to potential employers.
            </p>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="mb-16">
          <h2
            className="md:text-3xl text-xl font-semibold mb-8 text-cyan-200 text-center"
            
          >
            How Our Platform Works
          </h2>
          <div className="space-y-8 bg-gray-800 border border-gray-400 bg-transparent p-8 rounded-2xl">
            <div>
              <h3
                className="md:text-lg text-xm font-semibold mb-4"
                style={{ color: colors.primaryDark }}
              >
                AI-Powered Interview Simulations
              </h3>
              <p
                className=" text-xs leading-relaxed"
             
              >
                Experience realistic interview scenarios powered by cutting-edge AI technology. Our system generates
                industry-specific questions, adapts to your responses in real-time, and creates an authentic interview
                atmosphere that prepares you for any situation.
              </p>
            </div>

            <div>
              <h3
                className="md:text-lg text-xm font-semibold mb-4"
                style={{ color: colors.primaryDark }}
              >
                Personalized Feedback and Analytics
              </h3>
              <p
                className=" text-xs  leading-relaxed"
             
              >
                Receive detailed, constructive feedback on your responses, communication style, and overall performance.
                Our AI analyzes your speech patterns, content quality, and delivery to provide actionable insights
                that help you improve with every practice session.
              </p>
            </div>

            <div>
              <h3
                className="md:text-lg text-sm font-semibold mb-4"
                style={{ color: colors.primaryDark }}
              >
                Customizable Practice Sessions
              </h3>
              <p
                className=" text-xs  leading-relaxed"
               
              >
                Tailor your practice experience to match specific job roles, industries, and interview formats.
                From technical interviews to behavioral questions, our platform covers all interview types and
                adjusts difficulty levels based on your progress and confidence.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2
            className="md:text-3xl text-xl text-center font-semibold mb-8 text-cyan-200"
            
          >
            Why Choose Our AI Interview Platform
          </h2>
          <div
            className=" space-y-8 bg-gray-800 border border-gray-400 bg-transparent p-8 rounded-2xl"
           
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4
                  className="md:text-lg text-sm font-semibold mb-3"
                  style={{ color: colors.primaryDark }}
                >
                  Build Unshakeable Confidence
                </h4>
                <p
                  className="leading-relaxed text-xs"
           
                >
                  Practice in a safe, judgment-free environment where you can make mistakes, learn from them,
                  and build the confidence needed to excel in real interviews.
                </p>
              </div>
              <div>
                <h4
                  className="md:text-lg text-sm font-semibold mb-3"
                  style={{ color: colors.primaryDark }}
                >
                  Save Time and Resources
                </h4>
                <p
                  className="text-xs leading-relaxed"
                
                >
                  Access professional-quality interview preparation anytime, anywhere, without the need to
                  coordinate schedules with career counselors or interview coaches.
                </p>
              </div>
              <div>
                <h4
                  className="md:text-lg text-smfont-semibold mb-3"
                  style={{ color: colors.primaryDark }}
                >
                  Track Your Progress
                </h4>
                <p
                  className="text-xs leading-relaxed"
             
                >
                  Monitor your improvement over time with detailed performance metrics and personalized
                  recommendations that help you focus on areas that need the most attention.
                </p>
              </div>
              <div>
                <h4
                  className="md:text-lg text-sm font-semibold mb-3"
                  style={{ color: colors.primaryDark }}
                >
                  Stay Current with Trends
                </h4>
                <p
                  className="text-xs leading-relaxed"
                  
                >
                  Our AI stays updated with the latest interview trends, industry-specific requirements,
                  and emerging job market demands to keep your preparation relevant and effective.
                </p>
              </div>
            </div>
          </div>
        </div>

      
      </div>
    </div>
  );
};

export default AboutPage;

