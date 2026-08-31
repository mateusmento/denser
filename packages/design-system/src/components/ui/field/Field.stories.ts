import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Checkbox } from "../checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "./index";
import { Input } from "../input";

const meta = {
  title: "primitives/Field",
  component: Field,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: {
      FieldGroup,
      Field,
      FieldLabel,
      FieldContent,
      FieldDescription,
      Input,
    },
    setup: () => ({ args }),
    template: `
      <FieldGroup class="w-80">
        <Field v-bind="args">
          <FieldLabel for="name">Name</FieldLabel>
          <FieldContent>
            <Input id="name" placeholder="Artifact name" />
            <FieldDescription>Shown in the sidebar and breadcrumbs.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    `,
  }),
  args: { orientation: "vertical" },
};

export const Horizontal: Story = {
  render: () => ({
    components: {
      FieldGroup,
      Field,
      FieldLabel,
      FieldContent,
      Checkbox,
    },
    template: `
      <FieldGroup class="w-96">
        <Field orientation="horizontal">
          <FieldLabel for="notify">Notifications</FieldLabel>
          <FieldContent>
            <Checkbox id="notify" />
          </FieldContent>
        </Field>
      </FieldGroup>
    `,
  }),
};

export const Responsive: Story = {
  render: () => ({
    components: {
      FieldGroup,
      Field,
      FieldLabel,
      FieldContent,
      Input,
    },
    template: `
      <FieldGroup class="@container/field-group w-full max-w-lg">
        <Field orientation="responsive">
          <FieldLabel for="email">Email</FieldLabel>
          <FieldContent>
            <Input id="email" type="email" placeholder="you@example.com" />
          </FieldContent>
        </Field>
      </FieldGroup>
    `,
  }),
};
