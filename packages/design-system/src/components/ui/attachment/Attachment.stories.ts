import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { FileIcon } from "@lucide/vue";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "./index";

const meta = {
  title: "primitives/Attachment",
  component: Attachment,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm", "xs"],
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Attachment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: {
      Attachment,
      AttachmentMedia,
      AttachmentContent,
      AttachmentTitle,
      AttachmentDescription,
      FileIcon,
    },
    setup: () => ({ args }),
    template: `
      <Attachment v-bind="args">
        <AttachmentMedia>
          <FileIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>spec.pdf</AttachmentTitle>
          <AttachmentDescription>248 KB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    `,
  }),
  args: { size: "default", orientation: "horizontal" },
};

export const Sm: Story = {
  render: () => ({
    components: {
      Attachment,
      AttachmentMedia,
      AttachmentContent,
      AttachmentTitle,
      AttachmentDescription,
      FileIcon,
    },
    template: `
      <Attachment size="sm">
        <AttachmentMedia>
          <FileIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>notes.txt</AttachmentTitle>
          <AttachmentDescription>12 KB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    `,
  }),
};

export const Xs: Story = {
  render: () => ({
    components: {
      Attachment,
      AttachmentMedia,
      AttachmentContent,
      AttachmentTitle,
      FileIcon,
    },
    template: `
      <Attachment size="xs">
        <AttachmentMedia>
          <FileIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>icon.svg</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    components: {
      Attachment,
      AttachmentMedia,
      AttachmentContent,
      AttachmentTitle,
      FileIcon,
    },
    template: `
      <Attachment orientation="vertical">
        <AttachmentMedia>
          <FileIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>cover.png</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    `,
  }),
};
