import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { cn } from "~/utils/cn";

interface FaqItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  question: string;
  answer: string;
}

const FaqItem = (props: FaqItemProps) => {
  const { ref, question, answer, className, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className={cn("border-b border-black last:border-b-0", className)}
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 transition-colors text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
          <h3 className="font-henderson-slab text-lg font-bold">{question}</h3>
          <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-180">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </summary>
        <div className="pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
          <div
            className="prose prose-sm max-w-none text-black font-body leading-relaxed"
            dangerouslySetInnerHTML={{ __html: answer }}
          />
        </div>
      </details>
    </div>
  );
};

export default FaqItem;

export const schema = createSchema({
  type: "faq-accordion-item",
  title: "Faq accordion item",
  settings: [
    {
      group: "Question",
      inputs: [
        {
          type: "text",
          name: "question",
          label: "Question",
          defaultValue: "Question",
        },
        {
          type: "richtext",
          name: "answer",
          label: "Answer",
          defaultValue: "<p>Answer</p>",
        },
      ],
    },
  ],
});
