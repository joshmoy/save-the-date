import { Button, Container, Heading, type ButtonProps, type ContainerProps, type HeadingProps } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export type UpdateNotFoundProps = {
  heading?: string;
  backTo?: string;
  backLabel?: string;
  containerProps?: Omit<ContainerProps, "children">;
  headingProps?: Omit<HeadingProps, "children">;
  buttonProps?: Omit<ButtonProps, "children" | "onClick">;
};

export function UpdateNotFound({
  heading = "Update not found",
  backTo = "/updates",
  backLabel = "Back to Updates",
  containerProps,
  headingProps,
  buttonProps,
}: UpdateNotFoundProps) {
  const navigate = useNavigate();

  return (
    <Container centerContent p={10} {...containerProps}>
      <Heading {...headingProps}>{heading}</Heading>
      <Button mt={4} onClick={() => navigate(backTo)} {...buttonProps}>
        {backLabel}
      </Button>
    </Container>
  );
}

