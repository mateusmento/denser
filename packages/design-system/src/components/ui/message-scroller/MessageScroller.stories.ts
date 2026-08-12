import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Bubble, BubbleContent } from "../bubble";
import { Message, MessageContent } from "../message";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "./index";

const meta = {
  title: "primitives/MessageScroller",
  component: MessageScroller,
  tags: ["autodocs"],
} satisfies Meta<typeof MessageScroller>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      MessageScrollerProvider,
      MessageScroller,
      MessageScrollerViewport,
      MessageScrollerContent,
      MessageScrollerItem,
      Message,
      MessageContent,
      Bubble,
      BubbleContent,
    },
    template: `
      <MessageScrollerProvider class="h-64 w-96 rounded-lg border">
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              <MessageScrollerItem v-for="id in ['msg-1', 'msg-2', 'msg-3']" :key="id" :message-id="id">
                <Message class="px-3 py-2">
                  <MessageContent>
                    <Bubble variant="secondary">
                      <BubbleContent>{{ id }}: Sample message content.</BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>
    `,
  }),
};
