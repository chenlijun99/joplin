import { CommandRuntime, CommandDeclaration } from '../../../lib/services/CommandService';
const Note = require('lib/models/Note');
const BaseModel = require('lib/BaseModel');
const { _ } = require('lib/locale');
const eventManager = require('../../../eventManager');

export const declaration:CommandDeclaration = {
	name: 'editAlarm',
	label: () => _('Set alarm'),
	iconName: 'fa-clock',
};

export const runtime = (comp:any):CommandRuntime => {
	return {
		execute: async ({ noteId }:any) => {
			const note = await Note.load(noteId);

			const defaultDate = new Date(Date.now() + 2 * 3600 * 1000);
			defaultDate.setMinutes(0);
			defaultDate.setSeconds(0);

			comp.setState({
				promptOptions: {
					label: _('Set alarm:'),
					inputType: 'datetime',
					buttons: ['ok', 'cancel', 'clear'],
					value: note.todo_due ? new Date(note.todo_due) : defaultDate,
					onClose: async (answer:any, buttonType:string) => {
						let newNote = null;

						if (buttonType === 'clear') {
							newNote = {
								id: note.id,
								todo_due: 0,
							};
						} else if (answer !== null) {
							newNote = {
								id: note.id,
								todo_due: answer.getTime(),
							};
						}

						if (newNote) {
							await Note.save(newNote);
							eventManager.emit('alarmChange', { noteId: note.id, note: newNote });
						}

						comp.setState({ promptOptions: null });
					},
				},
			});
		},
		isEnabled: (props:any):boolean => {
			const { notes, noteId } = props;
			if (!noteId) return false;
			const note = BaseModel.byId(notes, noteId);
			return !!note.is_todo && !note.todo_completed;
		},
		mapStateToProps: (state:any):any => {
			return {
				noteId: state.selectedNoteIds.length === 1 ? state.selectedNoteIds[0] : null,
				notes: state.notes,
			};
		},
	};
};
