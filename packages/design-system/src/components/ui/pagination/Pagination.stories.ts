import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./index";

const meta = {
  title: "primitives/Pagination",
  component: Pagination,
  tags: ["autodocs"],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Pagination,
      PaginationContent,
      PaginationItem,
      PaginationPrevious,
      PaginationLink,
      PaginationNext,
    },
    setup: () => {
      const page = ref(1);
      return { page };
    },
    template: `
      <Pagination v-model:page="page" :total="50" :items-per-page="10">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink :value="1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink :value="2">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink :value="3">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
};
