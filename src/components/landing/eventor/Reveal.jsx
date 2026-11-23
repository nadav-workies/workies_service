import { motion } from "framer-motion";

// Gentle fade-up when the element enters the viewport (transform only, no layout shift).
export default function Reveal({ as = "div", delay = 0, children, ...props }) {
  const Tag = motion[as];
  return <Tag
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}
    {...props}
  >{children}</Tag>;
}