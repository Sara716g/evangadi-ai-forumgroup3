import React from "react";
import ReactMarkdown from "react-markdown";
import styles from "./RagAnswerBody.module.css";

export default function RagAnswerBody({ answer, citations }) {
  if (!answer) return null;

  return (
    <div className={styles.answerBody}>
      <ReactMarkdown
        components={{
          code({ inline, className, children, ...props }) {
            if (inline) {
              return (
                <code className={styles.inlineCode} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className={styles.codeBlock}>
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.citationLink}
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {answer}
      </ReactMarkdown>
      {citations && citations.length > 0 && (
        <div className={styles.citationsSection}>
          <span className={styles.citationsLabel}>Sources: </span>
          {citations.map((cite, idx) => (
            <span key={idx} className={styles.citationTag}>
              {cite.ref || `[${cite.chunkIndex}]`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
