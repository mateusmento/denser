import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./index";

const meta = {
  title: "primitives/Accordion",
  component: Accordion,
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" collapsible class="w-80">
        <AccordionItem value="item-1">
          <AccordionTrigger>What is denser?</AccordionTrigger>
          <AccordionContent>A scaffold for evolving artifacts.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How do properties work?</AccordionTrigger>
          <AccordionContent>Properties shape how artifacts render and behave.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
};
