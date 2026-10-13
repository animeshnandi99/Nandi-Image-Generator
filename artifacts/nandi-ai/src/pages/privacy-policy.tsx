import { LegalPage, LegalSection } from "@/components/legal-page";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <LegalSection title="Information stored in your browser">
        <p>
          NandiAi does not currently require an account. Generated images and chat history are saved in this browser using its local database. Use the Gallery delete controls or Clear in Chat to remove saved items. Clearing this site's browser data can also remove them.
        </p>
        <p>
          NandiAi does not keep a server-side account database or a server-side gallery of your generated images and chat history.
        </p>
      </LegalSection>

      <LegalSection title="Information sent to AI providers">
        <p>
          When you generate an image, the prompt, selected dimensions, and selected style are sent to Google Gemini. If that request fails, NandiAi tries Pollinations.ai instead. Those providers receive the information needed to generate the image.
        </p>
        <p>
          If you choose Improve prompt, the text prompt is sent through OpenRouter to the xAI Grok model. If you use Chat, your message and up to 20 earlier messages are sent through OpenRouter to DeepSeek. Chat is separate from image generation and does not send requests to the image generator.
        </p>
        <p>
          AI providers process these requests under their own terms and privacy practices. NandiAi does not control how those providers retain or otherwise use submitted content. Do not submit confidential or sensitive information unless you are comfortable sharing it with the applicable provider.
        </p>
      </LegalSection>

      <LegalSection title="How NandiAi uses information">
        <p>
          NandiAi processes prompts and messages to provide the requested image, prompt improvement, or chat response. The app server relays these requests and returns provider responses. The app has no account system or server-side database for storing this content.
        </p>
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <p>
          Images and chat history remain in this browser until you delete them in the app or clear the browser's site data. Retention by Google, Pollinations.ai, OpenRouter, and model providers is governed by their own policies.
        </p>
      </LegalSection>

      <LegalSection title="Contact and effective date">
        <p>
          The operator's legal name, privacy contact email, and effective date must be added before public release. They have not been supplied for this draft.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
