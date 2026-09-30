import type { ProjectFile } from '../graph/project';
import type { DraftProject } from '../storage/projectStorage';

interface Props {
  file: ProjectFile;
  draft: DraftProject;
  onChooseFile: () => void;
  onChooseDraft: () => void;
  onCancel: () => void;
}

export function RecoveryChoice({ file, draft, onChooseFile, onChooseDraft, onCancel }: Props) {
  return <main className="recovery-choice">
    <p className="eyebrow">Version choice</p>
    <h1>Choose which project version to open</h1>
    <p>A browser recovery draft differs from the project file. Choose the version to continue editing; the editor will write a fresh recovery draft.</p>
    <div className="recovery-options">
      <button type="button" onClick={onChooseFile}><strong>Open project file</strong><span>{file.name}</span></button>
      <button type="button" onClick={onChooseDraft}><strong>Recover browser draft</strong><span>Saved locally {new Date(draft.savedAt).toLocaleString()}</span></button>
    </div>
    <button className="text-button" type="button" onClick={onCancel}>Cancel</button>
  </main>;
}
