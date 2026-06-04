import clsx from "clsx";
import "./Container.css";

export default function Container({ children, narrow = false, className }) {
  return (
    <div className={clsx("container", narrow && "container--narrow", className)}>
      {children}
    </div>
  );
}
