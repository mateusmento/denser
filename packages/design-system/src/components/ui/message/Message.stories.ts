import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Bubble, BubbleContent } from "../bubble";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "./index";
import { Avatar, AvatarFallback } from "../avatar";

const meta = {
  title: "primitives/Message",
  component: Message,
  tags: ["autodocs"],
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Message,
      MessageAvatar,
      MessageHeader,
      MessageContent,
      MessageFooter,
      Avatar,
      AvatarFallback,
      Bubble,
      BubbleContent,
    },
    template: `
      <Message class="max-w-md">
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Jane Doe</MessageHeader>
          <Bubble>
            <BubbleContent>Can we review the artifact properties?</BubbleContent>
          </Bubble>
          <MessageFooter>10:42 AM</MessageFooter>
        </MessageContent>
      </Message>
    `,
  }),
};
