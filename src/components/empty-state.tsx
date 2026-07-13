export function EmptyStateRow({
  colSpan,
  title,
  body,
}: {
  colSpan: number;
  title: string;
  body: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <p className="font-heading text-base text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">{body}</p>
      </td>
    </tr>
  );
}
