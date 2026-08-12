import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./index";

const meta = {
  title: "primitives/Table",
  component: Table,
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Table,
      TableCaption,
      TableHeader,
      TableBody,
      TableRow,
      TableHead,
      TableCell,
    },
    template: `
      <Table class="w-96">
        <TableCaption>Recent artifacts</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Launch plan</TableCell>
            <TableCell>Draft</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Research notes</TableCell>
            <TableCell>Published</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
};
