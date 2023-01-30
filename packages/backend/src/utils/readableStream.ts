export function readableStreamFromGenerator<T>(
  generator: AsyncGenerator<T>
): ReadableStream<T> {
  return new ReadableStream({
    async pull(controller) {
      try {
        const nextValue = await generator.next();
        if (nextValue.done) {
          controller.close();
        }

        controller.enqueue(nextValue.value);
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
