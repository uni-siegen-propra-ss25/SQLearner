import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
    
    /** Current user's ID to check ownership of hints */
    @Input() currentUserId: number | null = null;
    
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
        { value: "all", label: 'DASHBOARD.ROLE_ALL' },
        { value: Role.STUDENT, label: 'DASHBOARD.ROLE_STUDENTS' },
        { value: Role.TUTOR, label: 'DASHBOARD.ROLE_TUTORS' },
    ];

    constructor(
        private hintService: HintService,
        private translate: TranslateService
    ) {}

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
            // Convert string to Role enum or undefined for "all"
            let targetRole: Role | undefined = undefined;
            if (this.newHintTargetRole && this.newHintTargetRole !== "all") {
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
     * Removes a hint from the system
     * Authors can delete their own hints, other users can mark hints as "done" (client-side removal)
     * @param index Index of the hint to remove
     */
    removeHint(index: number): void {
        const hint = this.hints[index];
        
        if (this.isAuthor(hint)) {
            // Author can delete the hint permanently
            if (hint.id) {
                this.hintService.deleteHint(hint.id).subscribe(() => {
                    this.hints.splice(index, 1);
                });
            }
        } else {
            // Other users can just hide the hint locally (mark as "done")
            this.hints.splice(index, 1);
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
        if (!role) return this.translate.instant('DASHBOARD.ROLE_ALL');
        switch (role) {
            case Role.STUDENT: return this.translate.instant('DASHBOARD.ROLE_STUDENTS');
            case Role.TUTOR: return this.translate.instant('DASHBOARD.ROLE_TUTORS');
            case Role.ADMIN: return this.translate.instant('DASHBOARD.ROLE_ADMINS');
            default: return this.translate.instant('DASHBOARD.AUTHOR_UNKNOWN');
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
        return this.translate.instant('DASHBOARD.AUTHOR_UNKNOWN');
    }

    /**
     * Checks if the current user is the author of a hint
     * @param hint The hint to check
     * @returns true if the current user is the author, false otherwise
     */
    isAuthor(hint: Hint): boolean {
        return this.currentUserId !== null && hint.authorId === this.currentUserId;
    }
}
