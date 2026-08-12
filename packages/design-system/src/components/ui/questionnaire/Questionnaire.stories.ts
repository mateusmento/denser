import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  Questionnaire,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnaireTitle,
} from "./index";

const meta = {
  title: "primitives/Questionnaire",
  component: Questionnaire,
  tags: ["autodocs"],
} satisfies Meta<typeof Questionnaire>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Questionnaire,
      QuestionnaireItem,
      QuestionnaireTitle,
      QuestionnaireInput,
      QuestionnaireNext,
    },
    template: `
      <Questionnaire class="w-96 space-y-4">
        <QuestionnaireItem name="name" required>
          <QuestionnaireTitle>What should we call this artifact?</QuestionnaireTitle>
          <QuestionnaireInput placeholder="My artifact" />
          <QuestionnaireNext />
        </QuestionnaireItem>
      </Questionnaire>
    `,
  }),
};
