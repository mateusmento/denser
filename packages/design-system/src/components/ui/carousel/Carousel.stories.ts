import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./index";
import { Card, CardContent } from "../card";

const meta = {
  title: "primitives/Carousel",
  component: Carousel,
  tags: ["autodocs"],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselPrevious,
      CarouselNext,
      Card,
      CardContent,
    },
    template: `
      <Carousel class="mx-auto w-full max-w-xs">
        <CarouselContent>
          <CarouselItem v-for="slide in 3" :key="slide">
            <Card>
              <CardContent class="flex aspect-square items-center justify-center p-6">
                <span class="text-4xl font-semibold">{{ slide }}</span>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
};
