"use client";

import { useState, useTransition } from "react";
import { createOrUpdatePlayer } from "./actions";

type Player = {
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender: string;
} | null;

export default function ProfileForm({ existing }: { existing: Player }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dobValue = existing?.date_of_birth
    ? new Date(existing.date_of_birth).toISOString().split("T")[0]
    : "";

  function handleSubmit(fd: FormData) {
    setError(null);
    setSuccess(false);
    start(async () => {
      const res = await createOrUpdatePlayer(fd);
      if (!res.success) setError(res.message ?? "Something went wrong.");
      else setSuccess(true);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-lg">
          Profile saved successfully!
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            First Name
          </label>
          <input
            name="first_name"
            required
            defaultValue={existing?.first_name ?? ""}
            placeholder="Alex"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Last Name
          </label>
          <input
            name="last_name"
            required
            defaultValue={existing?.last_name ?? ""}
            placeholder="Johnson"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Date of Birth
        </label>
        <input
          name="date_of_birth"
          type="date"
          required
          defaultValue={dobValue}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Gender
        </label>
        <select
          name="gender"
          required
          defaultValue={existing?.gender ?? ""}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
        >
          <option value="">Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 text-sm mt-2"
      >
        {pending ? "Saving…" : existing ? "Update Profile" : "Save Profile"}
      </button>
    </form>
  );
}
