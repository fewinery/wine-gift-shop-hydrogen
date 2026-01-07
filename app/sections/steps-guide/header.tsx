import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface StepsGuideHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function StepsGuideHeader(props: StepsGuideHeaderProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest} className="text-center">
      {children}
    </div>
  );
}

export default StepsGuideHeader;

export const schema = createSchema({
  type: "steps-guide--header",
  title: "Header",
  childTypes: ["heading", "subheading", "paragraph"],
});
