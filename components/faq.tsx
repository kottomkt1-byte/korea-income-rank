import { Plus } from "lucide-react";
import { faqs } from "@/lib/faq";
import { AdSlot } from "./ad-slot";
export function FAQ() {
  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <div>
        <p className="eyebrow">A LITTLE MORE CLARITY</p>
        <h2 id="faq-title">
          궁금한 점이
          <br />
          있으신가요?
        </h2>
        <p>
          숫자를 읽기 전에,
          <br />
          알아두면 좋은 이야기.
        </p>
      </div>
      <div className="faq-items">
        {faqs.map((item, index) => (
          <div key={item.question}>
            <details>
              <summary>
                {item.question}
                <Plus size={18} />
              </summary>
              <p>{item.answer}</p>
            </details>
            {index === 3 && <AdSlot placement="faq-middle" />}
          </div>
        ))}
      </div>
    </section>
  );
}
