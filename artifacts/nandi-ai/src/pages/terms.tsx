import { LegalPage, LegalSection } from "@/components/legal-page";

export default function Terms() {
  return (
    <LegalPage title="Terms and Conditions">
      <LegalSection title="Using NandiAi">
        <p>
          NandiAi provides an image-generation Studio, an optional prompt-improvement feature, a separate text chat, and a browser-based Gallery. The app currently has no accounts or paid plans.
        </p>
        <p>
          By using the service, you agree not to use it to violate applicable law, infringe another person's rights, or interfere with the service. You are responsible for the prompts and messages you submit.
        </p>
      </LegalSection>

      <LegalSection title="AI-generated content">
        <p>
          Responses and generated images can be inaccurate, unexpected, similar to other material, or unavailable. NandiAi does not guarantee that an output is unique, accurate, suitable for a particular purpose, or clear of third-party rights. Review outputs and confirm you have the rights needed for your intended use.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Image generation, prompt improvement, and chat rely on third-party AI providers. Their services, terms, and privacy practices apply when NandiAi sends them a request. A provider change or outage can affect availability or results.
        </p>
      </LegalSection>

      <LegalSection title="Saved content">
        <p>
          Generated images and chat history are saved in your browser, not in a NandiAi account. You are responsible for keeping copies of anything you want to retain. Deleting browser site data can remove saved content.
        </p>
      </LegalSection>

      <LegalSection title="Changes, contact, and governing law">
        <p>
          Features may change or become unavailable. The operator's legal name, contact email, effective date, and governing jurisdiction must be confirmed before public release. They have not been supplied for this draft.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
