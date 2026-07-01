import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Shield, Heart, Brain, Leaf,
  CheckCircle, Clock, Users, BookMarked
} from "@/lib/icons";

export default function Education() {
  return (
    <div className="bg-muted" style={{ scrollBehavior: 'smooth' }}>
      <div className="p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-foreground">Learn more about Kambo</h1>
      </div>

      <div className="p-4 sm:p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">For Clients</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <a href="#origins-section">
                <ArticleCard 
                  title="Origins of Kambo" 
                  icon={Leaf} 
                  imageUrl="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800"
                />
              </a>
              <a href="#benefits-section">
                <ArticleCard 
                  title="Health Benefits" 
                  icon={Heart} 
                  imageUrl="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800"
                />
              </a>
              <a href="#contraindications-section">
                <ArticleCard 
                  title="Health Contraindications" 
                  icon={Shield} 
                  imageUrl="https://images.unsplash.com/photo-1576091160550-2173dba9996a?q=80&w=800"
                />
              </a>
          </div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-8">
        <InfoSection 
          id="origins-section"
          title="The Origins and Traditions of Kambo"
          icon={Leaf}
          imageUrl="https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?q=80&w=1974&auto=format&fit=crop"
          content={() => (
            <>
              <p>Kambo is the name given to the waxy secretion of a giant green monkey frog, known by the scientific name <i>Phyllomedusa bicolor</i>. This frog is native to the upper Amazon basin and is found in parts of Brazil, Peru, Colombia, and other neighboring countries.</p>
              <p>For centuries, indigenous tribes such as the Matsés, Katukina, and Yawanawá have used Kambo for its purported healing and cleansing properties. Traditionally, it was used to boost stamina and hunting skills, to cleanse the body of "panema" (bad luck or negative energy), and to treat various illnesses. The secretion is ethically harvested without harming the frog, which is then safely returned to its habitat.</p>
            </>
          )}
        />
        <InfoSection 
          id="benefits-section"
          title="Potential Health Benefits"
          icon={Heart}
          imageUrl="https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop"
          content={() => (
            <>
              <p>Participants in Kambo ceremonies often report a wide range of benefits, both immediate and long-term. The secretion contains a complex cocktail of bioactive peptides that have potent effects on the human body.</p>
              <p className="font-semibold text-foreground">Commonly reported benefits include:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Deep physical and energetic cleansing.</li>
                <li>Strengthened immune system.</li>
                <li>Increased energy, stamina, and mental clarity.</li>
                <li>Reduced inflammation and pain.</li>
                <li>Relief from depression, anxiety, and PTSD.</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4 italic">Disclaimer: These statements have not been evaluated by the FDA. Kambo is not intended to diagnose, treat, cure, or prevent any disease.</p>
            </>
          )}
        />
      </div>

       <div className="p-4 sm:p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">For Practitioners</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <a href="#courses-section">
                <ArticleCard 
                  title="Practitioner Courses" 
                  icon={BookMarked} 
                  imageUrl="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800"
                />
              </a>
              <a href="#protocols-section">
                <ArticleCard 
                  title="Safety Protocols" 
                  icon={Shield} 
                  imageUrl="https://images.unsplash.com/photo-1628102490229-93051a85d342?q=80&w=800"
                />
              </a>
              <a href="#guidelines-section">
                <ArticleCard 
                  title="Community Guidelines" 
                  icon={Users} 
                  imageUrl="https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800"
                />
              </a>
          </div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-8">
        <InfoSection 
            id="courses-section"
            title="Choosing a Practitioner Course"
            icon={BookMarked}
            imageUrl="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop"
            content={() => (
              <>
                <p>Serving Kambo is a sacred responsibility that requires comprehensive training. When seeking a course, look for programs that emphasize:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Lineage & Tradition:</strong> Respectful teaching of the traditional origins and uses of the medicine.</li>
                  <li><strong>Safety First:</strong> In-depth training on contraindications, risk assessment, emergency response, and hygienic practices.</li>
                  <li><strong>Hands-On Experience:</strong> Supervised, practical application and receiving of Kambo under the guidance of experienced teachers.</li>
                  <li><strong>Integration Support:</strong> Education on how to help clients integrate their experience physically and emotionally.</li>
                  <li><strong>Ethical Conduct:</strong> Strong focus on practitioner ethics, scope of practice, and creating a safe ceremonial space.</li>
                </ul>
              </>
            )}
        />
         <InfoSection 
            id="protocols-section"
            title="Upholding Core Safety Protocols"
            icon={Shield}
            imageUrl="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop"
            content={() => (
              <>
                <p>A practitioner's primary duty is the safety of their clients. While this platform provides detailed information on contraindications, core protocols for every session must include:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Thorough Screening:</strong> Conducting a detailed health intake for every client, every time. Verbally re-confirming key contraindications before the session.</li>
                  <li><strong>Informed Consent:</strong> Ensuring clients understand the process, risks, and what to expect, and have signed a waiver.</li>
                  <li><strong>Hydration Management:</strong> Carefully monitoring a client's water intake before and during the ceremony to prevent hyponatremia.</li>
                  <li><strong>Sterile Practices:</strong> Using clean, sterile materials for making gates and handling the medicine.</li>
                  <li><strong>Vigilant Observation:</strong> Never leaving a client unattended during the process and being trained to recognize and respond to adverse reactions.</li>
                </ul>
              </>
            )}
        />
         <InfoSection 
            id="guidelines-section"
            title="Community & Ethical Guidelines"
            icon={Users}
            imageUrl="https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=2070&auto=format=fit"
            content={() => (
              <>
                <p>As part of the KamboConnect community, practitioners are expected to adhere to the highest ethical standards. These include:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Integrity:</strong> Representing your training, experience, and the medicine itself with honesty and humility.</li>
                  <li><strong>Respect:</strong> Honoring the indigenous origins of Kambo and the sacred nature of the frog.</li>
                  <li><strong>Confidentiality:</strong> Protecting client privacy and personal information.</li>
                  <li><strong>Right Relationship:</strong> Maintaining clear and professional boundaries with clients. Never making unsubstantiated healing claims.</li>
                  <li><strong>Collaboration:</strong> Fostering a supportive, non-competitive community with other practitioners, focused on collective well-being and safety.</li>
                </ul>
              </>
            )}
        />
      </div>


      <div className="p-4 sm:p-6" id="contraindications-section">
        {/* Safety Warning */}
        <Alert className="mb-8 border-amber-300 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <AlertDescription>
            <strong>Important:</strong> Kambo should only be administered by trained and experienced practitioners.
            This information is for educational purposes only and does not replace professional medical advice.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* What is Kambo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Leaf className="w-6 h-6 text-primary" />
                What is Kambo?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Kambo is a traditional Amazonian medicine derived from the waxy secretion of the
                Phyllomedusa bicolor frog (Giant Monkey Frog). Indigenous tribes have used it for
                centuries for physical and spiritual cleansing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The secretion contains bioactive peptides that can have various effects on the body,
                including purging, increased heart rate, and potential therapeutic benefits.
              </p>
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Brain className="w-6 h-6 text-purple-500" />
                How Does Kambo Work?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Kambo is applied to small burns (gates) created on the skin. The secretion enters
                the lymphatic system and triggers various physiological responses.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Activates the immune system</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">Stimulates natural detoxification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm">May influence neurotransmitter balance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Guidelines */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Shield className="w-7 h-7 text-red-500" />
              Critical Safety Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Contraindications Warning */}
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                Kambo Contraindications
              </h3>
              <p className="text-red-700 mb-6 leading-relaxed">
                These conditions, if present, indicate that Kambo should not be administered. 
                Administration under any of these circumstances may pose serious risk to health and safety.
              </p>

              {/* Absolute Contraindications */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
                  Absolute Contraindications
                </h4>
                <p className="text-sm text-red-600 mb-4 italic">
                  (Kambo should never be administered under these conditions)
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Pregnancy (at any stage)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Breastfeeding (until complete cessation)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="font-semibold">Heart conditions, including:</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Enlarged heart</li>
                          <li>• Irregular heartbeat (arrhythmias)</li>
                          <li>• Congestive heart failure</li>
                          <li>• Implanted pacemakers or defibrillators</li>
                          <li>• Heart valve replacements</li>
                          <li>• History of heart attack or stroke</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Aneurysms (or family history)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Blood clots, thrombosis, or embolism history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Stroke or brain hemorrhage (history of)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="font-semibold">Severe or active psychiatric disorders:</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Schizophrenia</li>
                          <li>• Bipolar disorder (unmedicated or unstable)</li>
                          <li>• Psychosis (current or past)</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Organ transplant recipients</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Addison's Disease</span>
                    </li>
                  </ul>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Recent surgery (within 6–8 weeks)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Recent COVID-19 vaccine (within the last 3 months)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Chronic low blood pressure (hypotension) that is symptomatic</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>High blood pressure – must be stable and well-controlled; monitor during session</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Active infection or illness (especially flu, COVID-19, or fever)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Epilepsy or seizure disorders (unless well-managed with practitioner approval)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Serious autoimmune conditions (e.g., Lupus, MS – use with great caution)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Severe asthma or other chronic lung conditions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Current chemotherapy or radiation treatment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Severe liver or kidney impairment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Use of recreational drugs, alcohol, or entactogens within the last 48–72 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="font-semibold">Current psychiatric medications:</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• SSRIs (e.g., Prozac, Zoloft)</li>
                          <li>• MAOIs</li>
                          <li>• Antipsychotics</li>
                          <li>• Benzodiazepines</li>
                          <li>• Lithium</li>
                        </ul>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Relative Contraindications */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-orange-700 mb-3 flex items-center gap-2">
                  Relative Contraindications / Use With Caution
                </h4>
                <p className="text-sm text-orange-600 mb-4 italic">
                  (Kambo may be used if the condition is managed and practitioner is experienced)
                </p>
                <ul className="space-y-2 text-sm text-orange-700 grid md:grid-cols-2 gap-4">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Diabetes (Type I or II) – monitor blood sugar levels, avoid during fasting or dehydration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Asthma – must have inhaler on site and be under control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Migraines – if active, postpone session</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Thyroid disorders – especially if taking medications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Severe anemia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Elderly (70+) – only with full medical clearance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Minors (under 18) – generally contraindicated except in specific cultural/traditional contexts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Immunocompromised individuals</span>
                  </li>
                </ul>
              </div>

              {/* Temporary Contraindications */}
              <div>
                <h4 className="text-lg font-bold text-yellow-700 mb-3 flex items-center gap-2">
                  Temporary Contraindications
                </h4>
                <p className="text-sm text-yellow-600 mb-4 italic">
                  (Wait appropriate time before administering Kambo)
                </p>
                <ul className="space-y-2 text-sm text-yellow-700 grid md:grid-cols-2 gap-4">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>COVID-19 infection – wait minimum 6 weeks after full recovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>COVID-19 vaccine – wait at least 3 months post-vaccine to ensure no interaction with immune system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Fasting for more than 24 hours – can cause blood pressure drop</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Recent use of Bufo (5-MeO-DMT) – wait 2–4 weeks minimum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Iboga/Ibogaine – wait at least 3 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Ayahuasca/Yagé – wait at least 7–10 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Intense emotional trauma or recent loss – practitioner discretion recommended</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* This column previously contained the brief contraindications, which are now replaced by the comprehensive block above. */}
              {/* Only Safety Requirements are kept here */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Safety Requirements
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    Work only with verified, experienced practitioners
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    Complete thorough health screening
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    Ensure clean, sterile environment
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    Have medical support available if needed
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    Follow all preparation guidelines
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    Plan for proper aftercare and integration
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What to Expect */}
        <div className="grid lg:grid-cols-2 gap-8 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Clock className="w-6 h-6 text-blue-500" />
                What to Expect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">During the Session:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Intense physical sensations</li>
                  <li>• Nausea and possible purging</li>
                  <li>• Increased heart rate and blood pressure</li>
                  <li>• Facial swelling (temporary)</li>
                  <li>• Strong energy followed by weakness</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Duration:</h4>
                <p className="text-sm text-muted-foreground">
                  Acute effects typically last 20-40 minutes, with full recovery
                  within 1-2 hours.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="w-6 h-6 text-indigo-500" />
                Choosing a Practitioner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    Essential
                  </Badge>
                  <span className="text-sm">Proper training and certification</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    Important
                  </Badge>
                  <span className="text-sm">Years of experience with Kambo</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                    Critical
                  </Badge>
                  <span className="text-sm">Clear safety protocols in place</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                    Valuable
                  </Badge>
                  <span className="text-sm">Positive client testimonials</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Always trust your intuition and take time to research and interview
                potential practitioners before committing to a session.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Final Notice */}
        <Alert className="mt-8 border-blue-300 bg-blue-50 text-blue-800">
          <Heart className="h-5 w-5 text-blue-500" />
          <AlertDescription>
            Remember: Your safety and well-being are paramount. Take time to research, ask questions,
            and ensure you feel completely comfortable with your chosen practitioner and setting
            before proceeding with any Kambo ceremony.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

const ArticleCard = ({ title, icon: Icon, imageUrl }) => (
    <Card className="shadow-sm border-border hover:shadow-lg hover:border-input transition-all cursor-pointer overflow-hidden bg-card group">
        <div className="w-full h-24 bg-muted relative">
            {imageUrl ? (
              <img loading="lazy" src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{title}</h3>
        </CardContent>
    </Card>
);

const InfoSection = ({ id, icon: Icon, title, content: Content, imageUrl }) => (
  <Card id={id} className="bg-card border-border shadow-sm overflow-hidden">
    {imageUrl && <img loading="lazy" src={imageUrl} alt={title} className="w-full h-56 object-cover opacity-90"/>}
    <div className="p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="flex items-center gap-3 text-xl text-foreground">
          <Icon className="w-6 h-6 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground leading-relaxed p-0">
        <Content />
      </CardContent>
    </div>
  </Card>
);