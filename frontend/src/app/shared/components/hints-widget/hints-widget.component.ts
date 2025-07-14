import { Component, Input, OnInit } from '@angular/core';
import { HintService, Hint, CreateHintDto, Role } from '../../services/hint.service';

/**
 * Hints Widget Component for displaying and managing system hints.
 * Shows role-based hints and allows tutors/admins to create and manage hints.
 */
@Component({
    selector: 'app-hints-widget',
    templateUrl: './hints-widget.component.html',
    styleUrls: ['./hints-widget.component.scss'],
})
export class HintsWidgetComponent implements OnInit {
    /** Whether the current user can manage hints (tutor/admin privileges) */
    @Input() canManage = false;
    
    /** Array of hints to display */
    hints: Hint[] = [];
    
    /** Title for new hint */
    newHintTitle = '';
    
    /** Content for new hint */
    newHintContent = '';
    
    /** Target role for new hint */
    newHintTargetRole: string  = "all"; // Default: "Alle Rollen"
    
    /** Available role options for hint targeting */
    roleOptions = [
        { value: "all", label: 'Alle' },
        { value: Role.STUDENT, label: 'Nur Studenten' },
        { value: Role.TUTOR, label: 'Nur Tutoren' },
    ];

    constructor(private hintService: HintService) {}

    ngOnInit(): void {
        this.loadHints();
    }

    /**
     * Loads hints based on user permissions
     * Admins/tutors can see all hints, students see only active hints for their role
     */
    loadHints(): void {
        const hintsObservable = this.canManage 
            ? this.hintService.getHintsForManagement()
            : this.hintService.getHints();
            
        hintsObservable.subscribe((hints) => {
            this.hints = hints;
        });
    }

    /**
     * Creates a new hint (only for users with manage permissions)
     */
    addHint(): void {
        if (!this.canManage) return;
        
        const title = this.newHintTitle.trim();
        const content = this.newHintContent.trim();
        
        if (title && content) {
            // Convert string to Role enum or undefined
            let targetRole: Role | undefined = undefined;
            if (this.newHintTargetRole && this.newHintTargetRole !== null) {
                targetRole = this.newHintTargetRole as Role;
            }
            
            const createDto: CreateHintDto = {
                title,
                content,
                targetRole,
            };
            
            this.hintService.createHint(createDto).subscribe((hint) => {
                this.hints.unshift(hint); // Add to beginning
                this.newHintTitle = '';
                this.newHintContent = '';
                this.newHintTargetRole = "all";
            });
        }
    }

    /**
     * Removes a hint from the system (only for users with manage permissions)
     * @param index Index of the hint to remove
     */
    removeHint(index: number): void {
        if (!this.canManage) return;
        
        const hint = this.hints[index];
        if (hint.id) {
            this.hintService.deleteHint(hint.id).subscribe(() => {
                this.hints.splice(index, 1);
            });
        }
    }

    /**
     * Toggles the active status of a hint (only for users with manage permissions)
     * @param hint The hint to toggle
     * @param index Index of the hint in the array
     */
    toggleHintStatus(hint: Hint, index: number): void {
        if (!this.canManage || !hint.id) return;
        
        this.hintService.updateHint(hint.id, { isActive: !hint.isActive }).subscribe((updatedHint) => {
            this.hints[index] = updatedHint;
        });
    }

    /**
     * Gets a human-readable label for a role
     * @param role The role to get a label for
     * @returns Localized role label
     */
    getRoleLabel(role: Role | null): string {
        if (!role) return 'Alle';
        switch (role) {
            case Role.STUDENT: return 'Studenten';
            case Role.TUTOR: return 'Tutoren';
            case Role.ADMIN: return 'Admins';
            default: return 'Unbekannt';
        }
    }

    /**
     * Gets the full name of a hint author
     * @param hint The hint to get author name for
     * @returns Author's full name or 'Unbekannt' if not available
     */
    getAuthorName(hint: Hint): string {
        if (hint.author) {
            return `${hint.author.firstName} ${hint.author.lastName}`;
        }
        return 'Unbekannt';
    }
}
