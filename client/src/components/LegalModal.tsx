import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const isTerms = type === 'terms';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {isTerms ? 'Terms of Service' : 'Privacy Policy'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isTerms 
              ? 'Please review our terms and conditions for using LeaderTalk.' 
              : 'Learn how we collect, use, and protect your personal information.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto px-6 py-4 min-h-0">
          <div className="space-y-6 text-sm leading-relaxed pr-2">
            {isTerms ? <TermsContent /> : <PrivacyContent />}
          </div>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 border-t bg-muted/30">
          <Button onClick={onClose} className="w-full" size="lg">
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TermsContent() {
  return (
    <>
      <div>
        <h3 className="font-semibold text-base mb-3">LeaderTalk Terms of Service</h3>
        <p className="text-muted-foreground mb-4">Last updated: January 2025</p>
      </div>

      <section>
        <h4 className="font-medium mb-2">1. Acceptance of Terms</h4>
        <p>
          By accessing and using LeaderTalk, you accept and agree to be bound by the terms and provision of this agreement. 
          If you do not agree to abide by the above, please do not use this service.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">2. Service Description</h4>
        <p>
          LeaderTalk is an AI-powered communication coaching platform that provides personalized leadership training through 
          speech analysis, feedback, and interactive learning modules. Our service uses artificial intelligence to analyze 
          your communication patterns and provide tailored recommendations.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">3. User Accounts and Responsibilities</h4>
        <div className="space-y-2">
          <p>• You must provide accurate and complete information when creating your account</p>
          <p>• You are responsible for maintaining the confidentiality of your account credentials</p>
          <p>• You agree to notify us immediately of any unauthorized use of your account</p>
          <p>• You must be at least 18 years old to use this service</p>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">4. Subscription and Billing</h4>
        <div className="space-y-2">
          <p>• LeaderTalk offers various subscription plans with different features and usage limits</p>
          <p>• Billing cycles are based on your subscription start date, not calendar months</p>
          <p>• Word usage limits reset at the beginning of each billing cycle</p>
          <p>• Subscription fees are non-refundable except as required by law</p>
          <p>• You may cancel your subscription at any time through your account settings</p>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">5. Usage Guidelines</h4>
        <div className="space-y-2">
          <p>• Use the service only for lawful purposes and in accordance with these terms</p>
          <p>• Do not upload content that is offensive, harmful, or violates others' rights</p>
          <p>• Respect the intellectual property rights of LeaderTalk and third parties</p>
          <p>• Do not attempt to reverse engineer or access our systems inappropriately</p>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">6. Privacy and Data</h4>
        <p>
          Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
          use, and protect your information. By using LeaderTalk, you consent to our data practices as 
          described in our Privacy Policy.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">7. Limitation of Liability</h4>
        <p>
          LeaderTalk provides the service "as is" without warranties of any kind. We shall not be liable 
          for any indirect, incidental, special, or consequential damages arising from your use of the service.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">8. Changes to Terms</h4>
        <p>
          We reserve the right to modify these terms at any time. We will notify users of significant 
          changes via email or through the service. Continued use of LeaderTalk after changes constitutes 
          acceptance of the new terms.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">9. Contact Information</h4>
        <p>
          If you have any questions about these Terms of Service, please contact us through our 
          support channels within the application.
        </p>
      </section>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <div>
        <h3 className="font-semibold text-base mb-3">LeaderTalk Privacy Policy</h3>
        <p className="text-muted-foreground mb-4">Last updated: January 2025</p>
      </div>

      <section>
        <h4 className="font-medium mb-2">1. Information We Collect</h4>
        <div className="space-y-3">
          <div>
            <h5 className="font-medium text-sm">Account Information</h5>
            <p>We collect information you provide when creating your account, including your name, email address, and profile details.</p>
          </div>
          <div>
            <h5 className="font-medium text-sm">Audio Recordings</h5>
            <p>When you use our speech analysis features, we process and temporarily store your audio recordings to provide feedback and coaching.</p>
          </div>
          <div>
            <h5 className="font-medium text-sm">Usage Data</h5>
            <p>We collect information about how you use LeaderTalk, including features accessed, training modules completed, and usage patterns.</p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">2. How We Use Your Information</h4>
        <div className="space-y-2">
          <p>• Provide and improve our coaching services</p>
          <p>• Analyze your communication patterns and provide personalized feedback</p>
          <p>• Process payments and manage your subscription</p>
          <p>• Send you service updates and educational content</p>
          <p>• Ensure security and prevent fraud</p>
          <p>• Comply with legal obligations</p>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">3. Data Storage and Security</h4>
        <div className="space-y-2">
          <p>• Your data is stored securely using industry-standard encryption</p>
          <p>• Audio recordings are processed and deleted after analysis completion</p>
          <p>• We implement appropriate technical and organizational measures to protect your data</p>
          <p>• Access to your personal data is limited to authorized personnel only</p>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">4. Third-Party Services</h4>
        <div className="space-y-3">
          <div>
            <h5 className="font-medium text-sm">Authentication</h5>
            <p>We use Google Firebase for secure authentication. Please review Google's privacy policy for their data practices.</p>
          </div>
          <div>
            <h5 className="font-medium text-sm">Payment Processing</h5>
            <p>Payment processing is handled by Stripe. We do not store your payment card information on our servers.</p>
          </div>
          <div>
            <h5 className="font-medium text-sm">AI Services</h5>
            <p>We use OpenAI services for speech analysis and coaching feedback. Audio data is processed according to OpenAI's data usage policies.</p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">5. Data Sharing</h4>
        <p>
          We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
        </p>
        <div className="space-y-2 mt-2">
          <p>• With service providers who assist in our operations (under strict confidentiality agreements)</p>
          <p>• When required by law or to protect our rights</p>
          <p>• In connection with a business transfer or acquisition (with prior notice)</p>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">6. Your Rights</h4>
        <div className="space-y-2">
          <p>• Access and review your personal data</p>
          <p>• Correct inaccurate information</p>
          <p>• Request deletion of your data (subject to legal requirements)</p>
          <p>• Export your data in a portable format</p>
          <p>• Opt out of marketing communications</p>
          <p>• Withdraw consent for data processing</p>
        </div>
      </section>

      <section>
        <h4 className="font-medium mb-2">7. Data Retention</h4>
        <p>
          We retain your personal data for as long as necessary to provide our services and comply with legal obligations. 
          Audio recordings are typically deleted within 30 days of processing, while account data is retained until you 
          delete your account.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">8. International Data Transfers</h4>
        <p>
          Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place 
          to protect your data in accordance with applicable privacy laws.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">9. Children's Privacy</h4>
        <p>
          LeaderTalk is not intended for children under 18. We do not knowingly collect personal information from 
          children under 18. If we become aware of such data collection, we will delete it immediately.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">10. Changes to This Policy</h4>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material changes via email 
          or through the service. We encourage you to review this policy periodically.
        </p>
      </section>

      <section>
        <h4 className="font-medium mb-2">11. Contact Us</h4>
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact us through 
          our support channels within the application.
        </p>
      </section>
    </>
  );
}