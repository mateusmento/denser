import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import * as z from "zod";
import { Button } from "../button";
import { Input } from "../input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./index";

const meta = {
  title: "primitives/Form",
  component: Form,
  tags: ["autodocs"],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: {
      Form,
      FormField,
      FormItem,
      FormLabel,
      FormControl,
      FormDescription,
      FormMessage,
      Input,
      Button,
    },
    setup: () => {
      const formSchema = toTypedSchema(
        z.object({
          username: z.string().min(2, "Username must be at least 2 characters."),
        }),
      );

      const form = useForm({
        validationSchema: formSchema,
        initialValues: { username: "" },
      });

      const onSubmit = form.handleSubmit(() => undefined);

      return { form, onSubmit };
    },
    template: `
      <form class="w-80 space-y-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="username">
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input placeholder="shadcn" v-bind="componentField" />
            </FormControl>
            <FormDescription>Your public display name.</FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        <Button type="submit">Submit</Button>
      </form>
    `,
  }),
};
